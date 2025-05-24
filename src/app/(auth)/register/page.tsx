'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Removed Shadcn/ui imports
import { registerUserSchema } from '@/schemas/userSchema'; // Your Zod schema for user registration
import { z } from 'zod';

type FormData = z.infer<typeof registerUserSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAcceptedPrivacy(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!acceptedPrivacy) {
      setError("You must accept the Privacy Policy.");
      return;
    }
    setLoading(true);

    try {
      const validatedData = registerUserSchema.parse(formData);
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }
      setSuccess('Registration successful! proceed to Log In.');
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const formattedErrors = err.errors.map(e => `${e.path.join('.')} (${e.message})`).join('\n');
        setError(`Validation errors:\n${formattedErrors}`);
      } else {
        setError(err.message || 'An unexpected error occurred.');
        console.error("Registration error:", err);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dff3e3] to-[#e3f6f1] p-4">
      <div className="flex max-w-4xl w-full shadow-xl rounded-3xl overflow-hidden bg-white">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-black text-[#28a745] mb-3 text-center sm:text-left">Stealth</h1>
          <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">Sign Up</h2>

          {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md whitespace-pre-line">{error}</p>}
          {success && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded-md">{success}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Standard HTML Input with Tailwind classes */}
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="rounded-full px-4 py-3 border text-black border-gray-300 focus:ring-2 focus:ring-[#28a745] focus:border-transparent outline-none transition-shadow"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
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
              type="tel"
              name="phone"
              placeholder="Phone Number"
              className="rounded-full px-4 py-3 border text-black border-gray-300 focus:ring-2 focus:ring-[#28a745] focus:border-transparent outline-none transition-shadow"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="rounded-full px-4 py-3 border text-black border-gray-300 focus:ring-2 focus:ring-[#28a745] focus:border-transparent outline-none transition-shadow"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />

            {/* Standard HTML Checkbox with Tailwind classes */}
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                id="privacyPolicy"
                className="form-checkbox h-5 w-5 text-[#28a745] rounded border-gray-300 focus:ring-[#38f9d7] cursor-pointer"
                checked={acceptedPrivacy}
                onChange={handleCheckboxChange}
                disabled={loading}
              />
              <span className="text-sm select-none">
                I Accept the <Link href="/privacy-policy" target="_blank" className="text-[#28a745] underline hover:text-[#1f7a33]">Privacy Policy</Link>
              </span>
            </label>

            {/* Standard HTML Button with Tailwind classes */}
            <button
              type="submit"
              className="mt-4 bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-black font-bold py-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !acceptedPrivacy}
            >
              {loading ? 'CREATING...' : 'CREATE AN ACCOUNT'}
            </button>

            <p className="text-sm mt-4 text-center">
              Already Have an Account? <Link href="/signin" className="text-[#28a745] font-semibold hover:underline">Log In</Link>
            </p>
          </form>
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