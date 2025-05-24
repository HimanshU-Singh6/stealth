'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Car, CalendarDays, DollarSign, FileText, ArrowLeft } from 'lucide-react';

// Interface for Vehicle details within a Lease
interface LeasedVehicle {
  _id: string;
  make: string;
  vehicleModel: string;
  year: number;
  imageUrl?: string;
  leasePrice: number;
  status: string; // Vehicle's own status
  license: string;
}

// Interface for a Lease document
interface Lease {
  _id: string;
  vehicleId: LeasedVehicle; // Populated vehicle details
  userId: string;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  status: 'active' | 'ended' | 'cancelled'; // Lease status
  createdAt: string;
}

export default function MyLeasesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [leases, setLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/my-leases');
    }
    if (authStatus === 'authenticated') {
      fetchMyLeases();
    }
  }, [authStatus, router]);

  const fetchMyLeases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users/me/leases');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch your leases');
      }
      const data: Lease[] = await response.json();
      setLeases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <p className="ml-3 text-xl text-gray-700">Loading Your Leases...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-800">My Leases</h1>
            </div>
            <Link href="/dashboard" legacyBehavior>
                <a className="text-sm text-green-600 hover:text-green-800 flex items-center">
                    <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
                </a>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {leases.length === 0 && !isLoading && !error && (
          <div className="text-center py-10">
            <Car size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">You currently have no active leases.</p>
            <Link href="/dashboard" legacyBehavior>
              <a className="mt-4 inline-block px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                Browse Vehicles
              </a>
            </Link>
          </div>
        )}

        {leases.length > 0 && (
          <div className="space-y-6">
            {leases.map((lease) => (
              <div key={lease._id} className="bg-white shadow-lg rounded-lg overflow-hidden md:flex">
                <div className="md:w-1/3 lg:w-1/4">
                  <img
                    src={lease.vehicleId?.imageUrl || 'https://placehold.co/400x300/EBF5FB/76D7C4/png?text=Vehicle'}
                    alt={`${lease.vehicleId?.make} ${lease.vehicleId?.vehicleModel}`}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>
                <div className="p-4 md:p-6 md:w-2/3 lg:w-3/4 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-green-700">
                        <Link href={`/vehicles/${lease.vehicleId?._id}`} legacyBehavior>
                            <a>{lease.vehicleId?.make} {lease.vehicleId?.vehicleModel} ({lease.vehicleId?.year})</a>
                        </Link>
                    </h2>
                    <p className="text-sm text-gray-500 mb-1">License: {lease.vehicleId?.license || 'N/A'}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                        <div className="flex items-center">
                            <CalendarDays size={16} className="text-gray-500 mr-2" />
                            <span>Start Date: {new Date(lease.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                            <CalendarDays size={16} className="text-gray-500 mr-2" />
                            <span>End Date: {new Date(lease.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                            <DollarSign size={16} className="text-green-600 mr-2" />
                            <span className="font-semibold">${lease.monthlyPayment}/month</span>
                        </div>
                         <div className="flex items-center">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full
                                ${lease.status === 'active' ? 'bg-green-100 text-green-800'
                                : lease.status === 'ended' ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'}`}>
                                Lease Status: {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                            </span>
                        </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
                    <Link href={`/vehicles/${lease.vehicleId?._id}`} passHref legacyBehavior>
                      <a className="w-full sm:w-auto text-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        View Vehicle Details
                      </a>
                    </Link>
                    {/* Add other actions like "Make a Payment", "View Agreement PDF" here */}
                    {/* <button className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Manage Payments
                    </button> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}