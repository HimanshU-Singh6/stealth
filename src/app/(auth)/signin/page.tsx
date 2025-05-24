import React, { Suspense } from 'react';
import SignInForm from './SignInForm'; // Import the new component

// Fallback UI for Suspense
function LoadingSignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dff3e3] to-[#e3f6f1] p-4">
      <div className="flex max-w-4xl w-full items-center justify-center">
         <p className="text-xl text-[#28a745]">Loading Sign In...</p>
         {/* You can put a more elaborate skeleton loader here if you want */}
      </div>
    </div>
  );
}

export default function SignInPageContainer() { // Renamed to avoid conflict if needed
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dff3e3] to-[#e3f6f1] p-4">
      <div className="flex max-w-4xl w-full shadow-xl rounded-3xl overflow-hidden bg-white">
        {/* Suspense wraps the component that uses useSearchParams */}
        <Suspense fallback={<LoadingSignIn />}> {/* Use the new LoadingSignIn as fallback */}
          <SignInForm />
        </Suspense>

        {/* Right Side - Visual Background (Kept from your original design) */}
        <div
          className="hidden md:flex md:w-1/2 bg-cover bg-center relative items-center justify-center"
          style={{ backgroundImage: "url('/your-3d-scene-image.jpg')" }} // Replace with your actual image path
        >
          <div className="absolute top-10 right-10 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg text-center">
            <p className="text-2xl font-bold">12,200+</p>
            <p className="text-green-600 font-semibold">now online</p>
          </div>
        </div>
      </div>
    </div>
  );
}