'use client';

import React, { useState, useEffect, Suspense } from 'react'; // Added Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { loginSchema } from '@/schemas/userSchema';
import { z } from 'zod';

type FormData = z.infer<typeof loginSchema>;

// This internal component will use useSearchParams
function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // useSearchParams is here
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { status } = useSession(); // 'session' data not used directly in this component's logic

  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const validatedData = loginSchema.parse(formData);
      const result = await signIn('credentials', {
        redirect: false,
        email: validatedData.email,
        password: validatedData.password,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please try again.");
        } else if (result.error.includes("Please verify your account")) {
          setError("Please verify your account before logging in.");
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        router.push(callbackUrl);
      } else {
        setError("An unknown error occurred during sign in.");
      }
    } catch (err) {
      const currentError = err as Error; // Type assertion
      if (err instanceof z.ZodError) {
        const formattedErrors = err.errors.map(e => `${e.path.join('.')} (${e.message})`).join('\n');
        setError(`Validation errors:\n${formattedErrors}`);
      } else {
        setError(currentError.message || 'An unexpected error occurred. Please try again.');
        console.error("Sign-in error:", currentError);
      }
    } finally {
      setLoading(false);
    }
  };

  // const handleDiscordSignIn = () => { // Removed as per ESLint error, or implement it
  //   alert("Discord Sign-In not implemented yet.");
  // };

  // Loading state for the form itself, or when auth is still loading.
  // This could be part of the Suspense fallback too.
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-xl text-[#28a745]">Checking session...</p>
      </div>
    );
  }

  // If authenticated, useEffect will redirect. This prevents form flash.
  if (status === 'authenticated') {
     return null; // Or a minimal loading message until redirect happens
  }

  return (
    <>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md whitespace-pre-line">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="rounded-full px-4 py-3 border text-black border-gray-300 focus:ring-2 focus:ring-[#28a745] focus:border-transparent outline-none transition-shadow"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="rounded-full px-4 py-3 text-black border border-gray-300 focus:ring-2 focus:ring-[#28a745] focus:border-transparent outline-none transition-shadow"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            {/* Remember me checkbox removed for simplicity as NextAuth handles session */}
          </label>
          <Link href="/auth/forgot-password"
            className="text-sm text-[#28a745] hover:underline">
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          className="mt-4 bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-black font-bold py-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'LOGGING IN...' : 'LOG IN'}
        </button>
        {/* Discord button removed for now as handleDiscordSignIn was unused. Add back if implementing. */}
        <p className="text-sm mt-4 text-center">
          {/* Corrected unescaped entity */}
          Don't Have an Account? <Link href="/register" className="text-[#28a745] font-semibold hover:underline">Sign Up</Link>
        </p>
      </form>
    </>
  );
}

// Fallback UI for Suspense
function FormLoadingFallback() {
  return (
    <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center items-center">
      <p className="text-xl text-[#28a745]">Loading Form...</p>
    </div>
  );
}


export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dff3e3] to-[#e3f6f1] p-4">
      <div className="flex max-w-4xl w-full shadow-xl rounded-3xl overflow-hidden bg-white">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-black text-[#28a745] mb-3 text-center sm:text-left">Welcome Back!</h1>
          <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">Log In to Stealth</h2>
          <Suspense fallback={<FormLoadingFallback />}>
            <SignInFormContent />
          </Suspense>
        </div>

        {/* Right Side - Visual Background */}
        <div
          className="hidden md:flex md:w-1/2 bg-cover bg-center relative items-center justify-center"
          style={{ backgroundImage: "url('/window.jpg')" }} 
        >
  
        </div>
      </div>
    </div>
  );
}