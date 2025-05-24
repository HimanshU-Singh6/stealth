'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { loginSchema } from '@/schemas/userSchema'; // Your Zod schema for login
import { z } from 'zod';

type FormData = z.infer<typeof loginSchema>;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'; // Default redirect after login
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
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
      // Validate form data using Zod schema
      const validatedData = loginSchema.parse(formData);

      const result = await signIn('credentials', {
        redirect: false, // We'll handle redirection manually to show errors
        email: validatedData.email,
        password: validatedData.password,
      });

      if (result?.error) {
        // Customize error messages based on NextAuth's error codes
        if (result.error === "CredentialsSignin") {
            setError("Invalid email or password. Please try again.");
        } else if (result.error.includes("Please verify your account")) { // Check your authorize function's error message
            setError("Please verify your account before logging in.");
        }
        else {
            setError(result.error);
        }
      } else if (result?.ok) {
        router.push(callbackUrl); // Redirect on successful sign-in
      } else {
        setError("An unknown error occurred during sign in.");
      }

    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors = err.errors.map(e => `${e.path.join('.')} (${e.message})`).join('\n');
        setError(`Validation errors:\n${formattedErrors}`);
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error("Sign-in error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordSignIn = () => {
    // For this to work, you need DiscordProvider configured in NextAuth options
    // signIn('discord', { callbackUrl }); // Example
    alert("Discord Sign-In not implemented yet.");
  };

  // Show loading state or prevent rendering form if already authenticated/loading
  if (status === 'loading') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dff3e3] to-[#e3f6f1]">
            <p className="text-xl text-[#28a745]">Loading...</p>
        </div>
    );
  }
  // If authenticated, useEffect will redirect, but this can prevent a flash of the form
  if (status === 'authenticated') {
    return null;
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dff3e3] to-[#e3f6f1] p-4">
      <div className="flex max-w-4xl w-full shadow-xl rounded-3xl overflow-hidden bg-white">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-black text-[#28a745] mb-3 text-center sm:text-left">Welcome Back!</h1>
          <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">Log In to Stealth</h2>

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
                {/* Basic "Remember me" - NextAuth handles session persistence via cookies */}
                {/* <input type="checkbox" className="form-checkbox h-4 w-4 text-[#28a745] rounded border-gray-300 focus:ring-[#38f9d7]" />
                <span className="text-sm select-none">Remember me</span> */}
              </label>
              <Link href="/auth/forgot-password"  // You'll need to create this page/flow
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


            <p className="text-sm mt-4 text-center">
              Don't Have an Account? <Link href="/auth/register" className="text-[#28a745] font-semibold hover:underline">Sign Up</Link>
            </p>
          </form>
        </div>

        {/* Right Side - Visual Background (Same as Register Page) */}
        <div
          className="hidden md:flex md:w-1/2 bg-cover bg-center relative items-center justify-center"
          style={{ backgroundImage: "url('/window.jpg')" }} // Replace with your actual image path
        >
        </div>
      </div>
    </div>
  );
}