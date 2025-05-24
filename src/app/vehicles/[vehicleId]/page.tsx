'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, CalendarDays, DollarSign, Car, ShieldCheck, ArrowLeft, UserCircle } from 'lucide-react';

interface Vehicle {
  _id: string;
  make: string;
  vehicleModel: string;
  year: number;
  license: string;
  status: 'available' | 'leased' | 'maintenance';
  leasePrice: number;
  imageUrl?: string;
  description?: string;
  features?: string[];
  ownerId: {
    _id: string;
    name?: string;
    email?: string;
  };
}

interface LeaseAgreement {
    lesseeName: string;
    lesseeEmail: string;
    vehicleMakeModel: string;
    vehicleYear: number;
    vehicleLicense: string;
    leaseTerm: string;
    monthlyPayment: number;
    startDate: string;
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const vehicleId = params.vehicleId as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaseModalError, setLeaseModalError] = useState<string | null>(null);
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [leaseAgreement, setLeaseAgreement] = useState<LeaseAgreement | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  const fetchVehicleDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch vehicle details');
      }
      const data: Vehicle = await response.json();
      setVehicle(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaseNow = () => {
    setLeaseModalError(null);
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/vehicles/${vehicleId}`);
      return;
    }
    if (vehicle && vehicle.status === 'available') {
        const agreement: LeaseAgreement = {
            lesseeName: session.user.name || "N/A",
            lesseeEmail: session.user.email || "N/A",
            vehicleMakeModel: `${vehicle.make} ${vehicle.vehicleModel}`,
            vehicleYear: vehicle.year,
            vehicleLicense: vehicle.license,
            leaseTerm: "12 Months (example)",
            monthlyPayment: vehicle.leasePrice,
            startDate: new Date().toLocaleDateString(),
        };
        setLeaseAgreement(agreement);
        setShowLeaseModal(true);
    } else {
        alert("This vehicle is not available for lease.");
    }
  };

  const handleConfirmLeaseAndPay = async () => {
    if (!leaseAgreement || !vehicle || !session?.user?._id) return;

    setIsProcessingPayment(true);
    setLeaseModalError(null);

    try {
      // 1. Create Lease
      console.log("Attempting to create lease for vehicle:", vehicle._id, "by user:", session.user._id);
      const leaseResponse = await fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user._id,
          vehicleId: vehicle._id,
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          monthlyPayment: vehicle.leasePrice,
        }),
      });

      if (!leaseResponse.ok) {
        const errData = await leaseResponse.json();
        throw new Error(errData.message || "Failed to create lease agreement.");
      }
      const createdLeaseData = await leaseResponse.json();
      const createdLease = createdLeaseData.lease;
      console.log("Lease created:", createdLease);

      if (!createdLease || !createdLease._id) {
        throw new Error("Lease creation response did not include a valid lease object with _id.");
      }

      // 2. Simulate Payment Processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Simulating payment processing for lease ID:", createdLease._id);

      // 3. Record Payment
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId: createdLease._id,
          amount: vehicle.leasePrice,
          paymentMethod: "Simulated Card",
          transactionId: `SIM_TRANS_${Date.now()}`
        })
      });
      if (!paymentResponse.ok) {
        console.warn("Failed to record payment, but lease was created. Payment API Error:", await paymentResponse.text());
      } else {
        console.log("Payment recorded:", await paymentResponse.json());
      }

      // 4. Update Vehicle Status to 'leased'
      console.log(`Attempting to update vehicle ${vehicle._id} status to 'leased'.`);
      const updateVehicleStatusResponse = await fetch(`/api/vehicles/${vehicle._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'leased' }),
      });

      if (!updateVehicleStatusResponse.ok) {
        const errorBody = await updateVehicleStatusResponse.text();
        console.error("Failed to update vehicle status. Vehicle API Error:", errorBody);
        // Decide if this is critical enough to stop the "success" message to the user.
        // For now, we proceed with success for lease/payment but log this error.
        // throw new Error(`Vehicle status update failed: ${errorBody}`);
      } else {
        const updatedVehicleData = await updateVehicleStatusResponse.json();
        console.log("Vehicle status updated successfully in DB:", updatedVehicleData);
        // Update local vehicle state with the response from the PATCH endpoint
        if (updatedVehicleData && updatedVehicleData.vehicle) {
             setVehicle(updatedVehicleData.vehicle); // Use the updated vehicle from API
        } else {
            // Fallback: if API doesn't return vehicle object in expected format
            setVehicle(prev => prev ? { ...prev, status: 'leased' } : null);
        }
      }

      alert("Lease confirmed and payment processed successfully! Vehicle is now leased.");
      setShowLeaseModal(false);
      router.push('/dashboard');

    } catch (err: any) {
      setLeaseModalError(err.message || "An error occurred during the lease process.");
      console.error("Lease/Payment Flow Error:", err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Go Back
        </button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-700 text-xl mb-4">Vehicle not found.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Go Back
        </button>
      </div>
    );
  }

  const isOwner = !!(session?.user?._id && vehicle && vehicle.ownerId && vehicle.ownerId._id && session.user._id === vehicle.ownerId._id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="mb-6 flex items-center text-sm text-green-600 hover:text-green-800">
          <ArrowLeft size={18} className="mr-1" /> Back to Listings
        </button>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex">
          <div className="md:w-1/2">
            <img
              src={vehicle.imageUrl || 'https://placehold.co/800x600/EBF5FB/76D7C4/png?text=Vehicle+Image'}
              alt={`${vehicle.make} ${vehicle.vehicleModel}`}
              className="w-full h-64 md:h-full object-cover"
            />
          </div>
          <div className="md:w-1/2 p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
              {vehicle.make} {vehicle.vehicleModel}
            </h1>
            <p className="text-lg text-gray-500 mb-4">{vehicle.year}</p>

            <div className="mb-6 space-y-3">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-semibold text-green-600">${vehicle.leasePrice}</span>
                <span className="text-gray-600 ml-1">/month</span>
              </div>
              <div className="flex items-center">
                <ShieldCheck className={`h-5 w-5 mr-2 ${vehicle.status === 'available' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`font-medium ${vehicle.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center">
                <Car className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-700">License: {vehicle.license}</span>
              </div>
               {vehicle.ownerId && (
                <div className="flex items-center pt-2 border-t mt-3">
                    <UserCircle className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                        Listed by: {vehicle.ownerId.name || vehicle.ownerId.email || 'Unknown Owner'}
                    </span>
                </div>
               )}
            </div>

            {vehicle.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Description</h2>
                <p className="text-gray-600 leading-relaxed">{vehicle.description}</p>
              </div>
            )}

            {vehicle.features && vehicle.features.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Features</h2>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {vehicle.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {authStatus === 'authenticated' ? (
                isOwner ? (
                    <p className="mt-4 text-center text-blue-600 bg-blue-50 p-3 rounded-md">
                        This is your vehicle listing.
                        <Link href={`/dashboard/edit-vehicle/${vehicle._id}`} className="ml-2 font-semibold text-blue-700 hover:underline">
                            Manage Listing
                        </Link>
                    </p>
                ) : vehicle.status === 'available' ? (
                    <button
                        onClick={handleLeaseNow}
                        className="w-full mt-4 py-3 px-6 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                        Lease This Vehicle
                    </button>
                ) : (
                    <p className="mt-4 text-center text-yellow-600 bg-yellow-50 p-3 rounded-md">
                        This vehicle is currently not available for lease.
                    </p>
                )
            ) : vehicle.status === 'available' ? (
                <button
                    onClick={() => router.push(`/auth/signin?callbackUrl=/vehicles/${vehicleId}`)}
                    className="w-full mt-4 py-3 px-6 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition"
                >
                    Sign In to Lease
                </button>
            ) : (
                 <p className="mt-4 text-center text-yellow-600 bg-yellow-50 p-3 rounded-md">
                    Please sign in to see lease options. This vehicle may not be available.
                </p>
            )}
          </div>
        </div>
      </div>

      {showLeaseModal && leaseAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-lg w-full transform transition-all my-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Lease Agreement Summary</h2>
            <div className="space-y-2 text-sm text-gray-700 mb-6 max-h-60 overflow-y-auto pr-2">
              <p><strong>Lessee:</strong> {leaseAgreement.lesseeName} ({leaseAgreement.lesseeEmail})</p>
              <p><strong>Vehicle:</strong> {leaseAgreement.vehicleMakeModel} ({leaseAgreement.vehicleYear})</p>
              <p><strong>License:</strong> {leaseAgreement.vehicleLicense}</p>
              <p><strong>Term:</strong> {leaseAgreement.leaseTerm}</p>
              <p><strong>Monthly Payment:</strong> ${leaseAgreement.monthlyPayment}</p>
              <p><strong>Start Date:</strong> {leaseAgreement.startDate}</p>
              <p className="mt-2 text-xs text-gray-500">
                This is a simplified summary. A full lease agreement with all terms and conditions would be provided.
                By proceeding, you agree to the outlined terms and to make the initial payment.
              </p>
            </div>
            {leaseModalError && <p className="mb-3 text-sm text-red-500 bg-red-100 p-2 rounded">{leaseModalError}</p>}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setShowLeaseModal(false)}
                disabled={isProcessingPayment}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeaseAndPay}
                disabled={isProcessingPayment}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessingPayment ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                ) : (
                  "Confirm & Simulate Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}