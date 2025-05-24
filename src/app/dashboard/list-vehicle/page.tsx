'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ListVehiclePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    make: '',
    vehicleModel: '',
    year: '',
    license: '', // Added license
    leasePrice: '',
    imageUrl: '',
    description: '', // Consider adding to your form and state if needed by backend
    features: '',    // For features, handle as array or comma-separated string
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // For features, if you want to handle them as an array from a comma-separated string:
  // const handleFeaturesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData(prevData => ({ ...prevData, features: e.target.value.split(',').map(f => f.trim()).filter(f => f) }));
  // };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Basic client-side validation
      if (!formData.make || !formData.vehicleModel || !formData.year || !formData.license || !formData.leasePrice) {
        throw new Error("Please fill in all required fields: Make, Model, Year, License Plate, and Lease Price.");
      }
      if (isNaN(parseInt(formData.year)) || isNaN(parseFloat(formData.leasePrice))) {
        throw new Error("Year and Lease Price must be valid numbers.");
      }


      const payload = {
        ...formData,
        year: parseInt(formData.year),
        leasePrice: parseFloat(formData.leasePrice),
        // If features is an array and description is used, include them:
        // description: formData.description,
        // features: formData.features.split(',').map(f => f.trim()).filter(f => f), // Example if features is a comma-separated string
      };

      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to list vehicle. Status: ${response.status}`);
      }

      // On success
      alert('Vehicle listed successfully!');
      router.push('/dashboard'); // Redirect back to dashboard
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="mb-4 text-sm text-green-600 hover:underline">
          ← Back to Dashboard
        </button>
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">List Your Vehicle</h1>
          {error && <p className="mb-4 text-sm text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700">Make</label>
              <input type="text" name="make" id="make" value={formData.make} onChange={handleChange} required
                     className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700">Model</label>
              <input type="text" name="vehicleModel" id="vehicleModel" value={formData.vehicleModel} onChange={handleChange} required
                     className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
              <input type="number" name="year" id="year" value={formData.year} onChange={handleChange} required
                     className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="license" className="block text-sm font-medium text-gray-700">License Plate</label>
              <input type="text" name="license" id="license" value={formData.license} onChange={handleChange} required
                     className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="leasePrice" className="block text-sm font-medium text-gray-700">Lease Price ($/month)</label>
              <input type="number" name="leasePrice" id="leasePrice" value={formData.leasePrice} onChange={handleChange} required step="0.01"
                     className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
              <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleChange}
                     className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            {/*
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3}
                     className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700">Features (Optional, comma-separated)</label>
              <input type="text" name="features" id="features" value={formData.features} onChange={handleChange}
                     className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            */}
            <button type="submit" disabled={isLoading}
                    className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50">
              {isLoading ? 'Submitting...' : 'List Vehicle'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}