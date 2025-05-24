'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'; // To ensure only owner can edit

interface VehicleData { // Define based on your form fields
    make: string;
    vehicleModel: string;
    year: string;
    license: string;
    leasePrice: string;
    imageUrl?: string;
    description?: string;
    status?: 'available' | 'leased' | 'maintenance';
    // Add other fields
}


export default function EditVehiclePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const vehicleId = params.vehicleId as string;

    const [formData, setFormData] = useState<Partial<VehicleData>>({}); // Partial initially
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (vehicleId) {
            const fetchVehicleData = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/vehicles/${vehicleId}`);
                    if (!res.ok) {
                        throw new Error('Failed to fetch vehicle data for editing.');
                    }
                    const data = await res.json();
                    // Ensure only owner can see/edit this data
                    if (session?.user?._id !== data.ownerId._id && session?.user?._id !== data.ownerId /* if ownerId is just string */) {
                         setError("You are not authorized to edit this vehicle.");
                         setIsLoading(false);
                         return;
                    }
                    setFormData({
                        make: data.make || '',
                        vehicleModel: data.vehicleModel || '',
                        year: data.year?.toString() || '',
                        license: data.license || '',
                        leasePrice: data.leasePrice?.toString() || '',
                        imageUrl: data.imageUrl || '',
                        description: data.description || '',
                        status: data.status || 'available',
                    });
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVehicleData();
        }
    }, [vehicleId, session]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                ...formData,
                year: formData.year ? parseInt(formData.year) : undefined,
                leasePrice: formData.leasePrice ? parseFloat(formData.leasePrice) : undefined,
            };

            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update vehicle');
            }
            alert('Vehicle updated successfully!');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete vehicle');
            }
            alert('Vehicle deleted successfully!');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }


    if (isLoading) return <p className="text-center p-10">Loading vehicle data...</p>;
    if (error && !formData.make) return <p className="text-center p-10 text-red-500">{error}</p>; // If error before form can load

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4">
            <button onClick={() => router.back()} className="mb-4 text-sm text-green-600 hover:underline">
                ← Back to Dashboard
            </button>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Vehicle Listing</h1>
                {error && <p className="mb-4 text-sm text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="make" className="block text-sm font-medium text-gray-700">Make</label>
                        <input type="text" name="make" id="make" value={formData.make || ''} onChange={handleChange} required
                            className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700">Model</label>
                        <input type="text" name="vehicleModel" id="vehicleModel" value={formData.vehicleModel || ''} onChange={handleChange} required
                            className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                        <input type="number" name="year" id="year" value={formData.year || ''} onChange={handleChange} required
                            className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="license" className="block text-sm font-medium text-gray-700">License Plate</label>
                        <input type="text" name="license" id="license" value={formData.license || ''} onChange={handleChange} required
                            className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="leasePrice" className="block text-sm font-medium text-gray-700">Lease Price ($/month)</label>
                        <input type="number" name="leasePrice" id="leasePrice" value={formData.leasePrice || ''} onChange={handleChange} required step="0.01"
                            className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL</label>
                        <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl || ''} onChange={handleChange}
                            className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3}
                            className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" value={formData.status || 'available'} onChange={handleChange}
                            className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm">
                            <option value="available">Available</option>
                            <option value="leased">Leased</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button type="submit" disabled={isSubmitting}
                                className="w-full sm:w-auto flex-grow py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                         <button type="button" onClick={handleDelete} disabled={isSubmitting}
                                className="w-full sm:w-auto py-2 px-4 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50">
                            {isSubmitting ? 'Deleting...' : 'Delete Listing'}
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}