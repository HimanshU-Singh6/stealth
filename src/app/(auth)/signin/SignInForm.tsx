'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // useSearchParams is here
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { loginSchema } from '@/schemas/userSchema';
import { z } from 'zod';

type FormData = z.infer<typeof loginSchema>;

export default function SignInForm() { // Renamed component
  const router = useRouter();
  const searchParams = useSearchParams(); // Used here
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { status } = useSession(); // Removed unused 'session' variable

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

 // Removed unused handleDiscordSignIn or implement it
 // const handleDiscordSignIn = () => {
 //   alert("Discord Sign-In not implemented yet.");
 // };

  if (status === 'loading') { // Simplified loading state for the form itself
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-xl text-[#28a745]">Loading form...</p>
      </div>
    );
  }
  // If authenticated, useEffect will redirect. This prevents form flash.
  if (status === 'authenticated') {
     return null;
  }

  return (
    <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
      <h1 className="text-4xl font-black text-[#28a745] mb-3 text-center sm:text-left">Welcome Back!</h1>
      <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">Log In to Elysium</h2>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md whitespace-pre-line">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="rounded-full text-black px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#28a745] focus:border-transparent outline-none transition-shadow"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="rounded-full text-black px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#28a745] focus:border-transparent outline-none transition-shadow"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
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
        <button
          type="button"
         //  onClick={handleDiscordSignIn} // Removed or implement
          onClick={() => alert("Discord Sign-In not implemented yet.")}
          className="mt-2 text-white bg-[#5865F2] hover:bg-[#4752c4] rounded-full font-bold py-3 border border-[#5865F2] hover:border-[#4752c4] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.297 4.492A9.568 9.568 0 0012.013.03a9.562 9.562 0 00-8.277 4.46C1.74 6.703 0 10.407 0 12.013c0 1.606 1.74 5.31 3.736 7.52a9.568 9.568 0 008.277 4.462 9.562 9.562 0 008.277-4.462c1.996-2.21 3.736-5.914 3.736-7.52 0-1.606-1.74-5.31-3.736-7.521zM8.398 15.797c-.2 0-.387-.02-.573-.067-.94-.24-1.533-1.046-1.533-1.966 0-1.14.92-2.06 2.06-2.06.133 0 .26.013.38.033.08.013.153.033.226.053.16.046.313.1.46.16.38.16.68.433.86.78.26.52.333.993.28 1.48-.06.54-.34 1.06-.8 1.46-.48.413-1.08.626-1.726.626zm7.226 0c-.646 0-1.246-.213-1.726-.626-.46-.4-.74-.92-.8-1.46-.053-.486.02-.96.28-1.48.18-.346.48-.62.86-.78.146-.06.3-.113.46-.16.073-.02.146-.033.226-.053.12-.02.246-.033.38-.033 1.14 0 2.06.92 2.06 2.06 0 .92-.593 1.726-1.533 1.966-.186.047-.373.067-.573.067z" />
          </svg>
          CONTINUE WITH DISCORD
        </button>
        <p className="text-sm mt-4 text-center">
          Don't Have an Account? <Link href="/auth/register" className="text-[#28a745] font-semibold hover:underline">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}