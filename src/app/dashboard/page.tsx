'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Icons (example using lucide-react, or use SVGs)
import { LogOut, Car, PlusCircle, Filter, ArrowUpDown, MessageCircle, Search, X, Edit3, Eye } from 'lucide-react';

// Define a type for your vehicle data
interface Vehicle {
  _id: string;
  make: string;
  vehicleModel: string;
  year: number;
  leasePrice: number;
  status: 'available' | 'leased' | 'maintenance';
  imageUrl?: string;
  ownerId: string; // Assuming API sends ownerId as a string for the dashboard list
                   // If it's populated, adjust accordingly: ownerId: { _id: string; name?: string; }
}

// Define a type for sorting options
type SortOption = 'price-asc' | 'price-desc' | 'year-asc' | 'year-desc' | 'make-asc';

// Define a type for filter criteria
interface FilterCriteria {
  make: string;
  minPrice: string; // Use string for input, parse to number later
  maxPrice: string;
  status: 'all' | 'available' | 'leased';
}

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    make: '',
    minPrice: '',
    maxPrice: '',
    status: 'all',
  });
  const [sortOption, setSortOption] = useState<SortOption>('make-asc');
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchVehicles();
      fetchUserVehicles();
    }
  }, [authStatus]);

  const fetchVehicles = async () => {
    setIsLoading(true);
    setError(null); // Reset error before fetching
    try {
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch vehicles');
      }
      const data: Vehicle[] = await response.json();
      setAllVehicles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVehicles = async () => {
    try {
      const response = await fetch('/api/users/me/vehicles');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch user vehicles');
      }
      const data: Vehicle[] = await response.json();
      setUserVehicles(data);
    } catch (err: any) {
      console.error("Error fetching user vehicles:", err.message);
      // setError(err.message); // You might want a separate error state for user vehicles
    }
  };

  const displayedVehicles = useMemo(() => {
    let filtered = [...allVehicles];
    if (searchTerm) {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.make) {
      filtered = filtered.filter((vehicle) =>
        vehicle.make.toLowerCase().includes(filters.make.toLowerCase())
      );
    }
    if (filters.minPrice && !isNaN(parseFloat(filters.minPrice))) {
      filtered = filtered.filter((vehicle) => vehicle.leasePrice >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice && !isNaN(parseFloat(filters.maxPrice))) {
      filtered = filtered.filter((vehicle) => vehicle.leasePrice <= parseFloat(filters.maxPrice));
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((vehicle) => vehicle.status === filters.status);
    }
    switch (sortOption) {
      case 'price-asc': filtered.sort((a, b) => a.leasePrice - b.leasePrice); break;
      case 'price-desc': filtered.sort((a, b) => b.leasePrice - a.leasePrice); break;
      case 'year-asc': filtered.sort((a, b) => a.year - b.year); break;
      case 'year-desc': filtered.sort((a, b) => b.year - a.year); break;
      case 'make-asc': filtered.sort((a, b) => a.make.localeCompare(b.make)); break;
    }
    return filtered;
  }, [allVehicles, searchTerm, filters, sortOption]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ make: '', minPrice: '', maxPrice: '', status: 'all' });
    setSearchTerm('');
  };

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [authStatus, router]);

  if (authStatus === 'loading' || (isLoading && allVehicles.length === 0)) { // Show loading if auth is loading OR initial vehicle fetch is happening
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Loading Dashboard...</p>
        {/* You can add a spinner here e.g. <Loader2 className="animate-spin h-8 w-8 text-green-600" /> */}
      </div>
    );
  }

  if ((isLoading && allVehicles.length === 0 && authStatus !== 'unauthenticated') || authStatus === 'loading' ) { // Redirect if no session and not loading (should be caught by useEffect too)
    // router.push('/auth/signin'); // This can cause hydration errors if called directly in render
    return null; // useEffect will handle redirect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-green-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-800">Vehicle Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, {session?.user?.name || session?.user?.email}
              </span>
              <Link href="/dashboard/list-vehicle" legacyBehavior>
                <a className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center">
                  <PlusCircle size={18} className="mr-1" /> List Your Car
                </a>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })} // Changed callback to /auth/signin
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 flex items-center"
              >
                <LogOut size={18} className="mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by make or model..."
                className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
              >
                <Filter size={18} className="mr-1" /> Filters
              </button>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-3 py-2 border text-black border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="make-asc">Sort by Make (A-Z)</option>
                <option value="price-asc">Sort by Price (Low-High)</option>
                <option value="price-desc">Sort by Price (High-Low)</option>
                <option value="year-desc">Sort by Year (Newest)</option>
                <option value="year-asc">Sort by Year (Oldest)</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
              <div>
                <label htmlFor="filter-make" className="block text-sm font-medium text-gray-700">Make</label>
                <input type="text" name="make" id="filter-make" value={filters.make} onChange={handleFilterChange}
                       className="mt-1 block w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="filter-minPrice" className="block text-sm font-medium text-gray-700">Min Price ($)</label>
                <input type="number" name="minPrice" id="filter-minPrice" value={filters.minPrice} onChange={handleFilterChange}
                       className="mt-1 block w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="filter-maxPrice" className="block text-sm font-medium text-gray-700">Max Price ($)</label>
                <input type="number" name="maxPrice" id="filter-maxPrice" value={filters.maxPrice} onChange={handleFilterChange}
                       className="mt-1 block w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="filter-status" value={filters.status} onChange={handleFilterChange}
                        className="mt-1 block w-full px-3 py-2 text-black border border-gray-300 bg-white rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm">
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="leased">Leased</option>
                </select>
              </div>
              <div className="col-span-full flex justify-end mt-2">
                <button onClick={resetFilters} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-md">{error}</p>}
        {!isLoading && displayedVehicles.length === 0 && !error && (
          <p className="text-gray-600 text-center py-10">No vehicles found matching your criteria.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedVehicles.map((vehicle) => (
            <div key={vehicle._id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl">
              <div className="relative">
                <img
                    src={vehicle.imageUrl || 'https://placehold.co/400x250/EBF5FB/76D7C4/png?text=Vehicle+Image'}
                    alt={`${vehicle.make} ${vehicle.vehicleModel}`}
                    className="w-full h-48 object-cover"
                />
                {session?.user?._id === vehicle.ownerId && (
                     <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white opacity-90">
                       Your Listing
                     </span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-gray-800 truncate" title={`${vehicle.make} ${vehicle.vehicleModel}`}>
                  {vehicle.make} {vehicle.vehicleModel}
                </h3>
                <p className="text-sm text-gray-500 mb-1">{vehicle.year}</p>
                <p className="text-lg font-bold text-green-600 mb-2">${vehicle.leasePrice}<span className="text-xs font-normal text-gray-500">/month</span></p>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${vehicle.status === 'available' ? 'bg-green-100 text-green-800'
                      : vehicle.status === 'leased' ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'}`}
                  >
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </span>
                </div>
                <Link href={`/vehicles/${vehicle._id}`} passHref legacyBehavior>
                  <a className="mt-auto w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-center flex items-center justify-center">
                    <Eye size={16} className="mr-1.5" /> View Details
                  </a>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {userVehicles.length > 0 && (
            <div className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Listed Cars</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {userVehicles.map((vehicle) => (
                         <div key={vehicle._id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl">
                            <img
                                src={vehicle.imageUrl || 'https://placehold.co/400x250/EBF5FB/76D7C4/png?text=Vehicle+Image'}
                                alt={`${vehicle.make} ${vehicle.vehicleModel}`}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-xl font-semibold text-gray-800 truncate" title={`${vehicle.make} ${vehicle.vehicleModel}`}>
                                {vehicle.make} {vehicle.vehicleModel}
                                </h3>
                                <p className="text-sm text-gray-500 mb-1">{vehicle.year}</p>
                                <p className="text-lg font-bold text-green-600 mb-2">${vehicle.leasePrice}<span className="text-xs font-normal text-gray-500">/month</span></p>
                                 <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full self-start mb-3
                                    ${vehicle.status === 'available' ? 'bg-green-100 text-green-800'
                                    : vehicle.status === 'leased' ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'}`}
                                >
                                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                                </span>
                                <Link href={`/dashboard/edit-vehicle/${vehicle._id}`} passHref legacyBehavior>
                                  <a className="mt-auto w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium text-center flex items-center justify-center">
                                    <Edit3 size={16} className="mr-1.5" /> Manage Listing
                                  </a>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          aria-label="Toggle Chatbot"
        >
          {showChatbot ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {showChatbot && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col z-50 transform transition-all duration-300 ease-out">
          <div className="p-3 bg-green-600 text-white rounded-t-lg flex justify-between items-center">
            <h4 className="font-semibold">Elysium Chat</h4> {/* Changed Chatbot name */}
            <button onClick={() => setShowChatbot(false)} className="text-white hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto text-black"> {/* Added text-black for chat messages */}
            <p className="text-sm text-gray-500">Chatbot is under construction!</p>
            <p className="text-sm text-gray-500 mt-2">Ask me anything about our vehicles.</p>
          </div>
          <div className="p-3 border-t">
            <input type="text" placeholder="Type your message..." className="w-full px-3 py-2 text-black border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}