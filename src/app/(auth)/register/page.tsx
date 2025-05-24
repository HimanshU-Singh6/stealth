'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { registerUserSchema } from '@/schemas/userSchema';
import { z } from 'zod';
import { sendWelcomeEmail } from '@/services/sendEmail';

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

      const registerResponse = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerData.message || 'Registration failed.');
      }

      sendWelcomeEmail({ toEmail: formData.email, toName: formData.name })
      .then(emailResponse => {
        if (emailResponse.success) {
          console.log(`Welcome email sent to ${formData.email}, Message ID: ${emailResponse.messageId}`);
        } else {
          console.error(`Failed to send welcome email to ${formData.email}: ${emailResponse.error}`);
        }
      })
      .catch(emailError => {
        console.error(`Unhandled error sending welcome email to ${formData.email}:`, emailError);
      });

      setSuccess('Registration successful! Logging you in...');

      const signInResponse = await signIn('credentials', {
        redirect: false,
        email: validatedData.email,
        password: validatedData.password,
      });

      if (signInResponse?.error) {
        setError(`Registration successful, but auto-login failed: ${signInResponse.error}. Please try logging in manually.`);
        setSuccess(null);
        setLoading(false);
        return;
      }

      if (signInResponse?.ok) {
        router.push('/dashboard');
      } else {
        setError("Registration successful, but couldn't automatically log you in. Please log in manually.");
        setLoading(false);
      }

    } catch (err) {
      const currentError = err as Error;
      if (err instanceof z.ZodError) {
        const formattedErrors = err.errors.map(e => `${e.path.join('.')} (${e.message})`).join('\n');
        setError(`Validation errors:\n${formattedErrors}`);
      } else {
        setError(currentError.message || 'An unexpected error occurred.');
        console.error("Registration or Auto-Login Error:", currentError);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dff3e3] to-[#e3f6f1] p-4">
      <div className="flex max-w-4xl w-full shadow-xl rounded-3xl overflow-hidden bg-white">
        <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-black text-[#28a745] mb-3 text-center sm:text-left">Stealth</h1>
          <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">Sign Up</h2>

          {error && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md whitespace-pre-line">{error}</p>}
          {success && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded-md">{success}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <button
              type="submit"
              className="mt-4 bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-black font-bold py-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !acceptedPrivacy}
            >
              {loading ? 'PROCESSING...' : 'CREATE AN ACCOUNT & LOG IN'}
            </button>
            <p className="text-sm mt-4 text-center">
              Already Have an Account? <Link href="/signin" className="text-[#28a745] font-semibold hover:underline">Log In</Link>
            </p>
          </form>
        </div>
       <div
          className="hidden md:flex md:w-1/2 bg-cover bg-center relative items-center justify-center"
          style={{ backgroundImage: "url('/window.jpg')" }}
        >
        </div>
      </div>
    </div>
  );
}