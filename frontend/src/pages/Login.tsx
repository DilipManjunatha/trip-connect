/**
 * Login — public auth screen (spec: mobile-first, design tokens, clear hierarchy).
 */

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, MapPinIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { Button, Input, FormField } from '../components/ui';
import { LoginForm } from '../types';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, user, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    clearError();
    await login(data.email, data.password);
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      {/* Left: branding (hidden on small mobile, visible from sm) */}
      <div className="hidden sm:flex sm:w-2/5 lg:w-2/5 bg-primary-600 flex-col justify-center px-8 lg:px-12 py-16">
        <div className="max-w-xs">
          <div className="flex items-center gap-3 text-white">
            <div className="rounded-xl bg-white/15 p-3">
              <MapPinIcon className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Trip Connect</span>
          </div>
          <p className="mt-6 text-primary-100 text-lg leading-relaxed">
            Plan trips, share expenses, and stay in sync with your group—all in one place.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile: logo + title */}
          <div className="sm:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 text-primary-600">
              <MapPinIcon className="h-8 w-8" />
              <span className="text-xl font-bold">Trip Connect</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
              <p className="mt-1 text-sm text-gray-500">Use your email and password to continue.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div
                  className="rounded-lg bg-error-50 border border-error-100 p-4 flex gap-3"
                  role="alert"
                >
                  <ExclamationCircleIcon className="h-5 w-5 text-error-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-error-800">{error}</p>
                </div>
              )}

              <FormField label="Email" required error={errors.email?.message}>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="text-base py-3.5 px-4 rounded-xl min-h-[52px] border-gray-300 placeholder-gray-400"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </FormField>

              <div className="w-full">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="block w-full text-base py-3.5 px-4 pr-14 min-h-[52px] rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    aria-invalid={!!errors.password}
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-14 min-h-[52px] text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded-r-xl"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-error-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </div>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
