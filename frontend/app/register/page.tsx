'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Auth } from '@/lib/api/sdk.gen';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import NoiseOverlay from '@/components/ui/NoiseOverlay';
import Navbar from '@/components/sections/Navbar';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    try {
      const response = await Auth.register({
        body: {
          email: data.email,
          password: data.password,
        },
      });
      
      if (response.error) {
        // @ts-ignore - Handle backend validation errors
        const detail = response.error?.detail;
        const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Registration failed');
        setError(message);
        return;
      }
      
      setSuccess(true);
      // Wait a bit then redirect to login for B2B flow
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    }
  };

  return (
    <main className="relative min-h-screen bg-[#080808] text-white overflow-hidden flex flex-col">
      <NoiseOverlay />
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 pt-24">
        {/* Glow effect behind */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[100px] bg-lime-400/20 rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-neutral-800 bg-neutral-900/50 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-8 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight text-white italic">
                Join <span className="text-lime-400">Bariweb</span>
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Unlock full compliance & AI-powered accessibility for your site
              </CardDescription>
            </CardHeader>
            
            {success ? (
              <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-lime-400/20 flex items-center justify-center text-lime-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Success!</h3>
                <p className="text-neutral-400 text-center">Redirecting you to login...</p>
              </CardContent>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-medium">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300 ml-1" htmlFor="email">
                      Office Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="business@company.com"
                      className="bg-neutral-950/50 border-neutral-800 focus:border-lime-400 transition-all text-white placeholder:text-neutral-700 h-12 rounded-xl"
                      {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-red-400 mt-1 ml-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300 ml-1" htmlFor="password">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-neutral-950/50 border-neutral-800 focus:border-lime-400 transition-all text-white h-12 rounded-xl"
                      {...form.register('password')}
                    />
                    {form.formState.errors.password && (
                      <p className="text-xs text-red-400 mt-1 ml-1">{form.formState.errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-6 pt-4">
                  <Button 
                    className="w-full h-12 rounded-xl bg-lime-400 text-black font-bold hover:scale-[1.02] active:scale-95 transition-all" 
                    type="submit" 
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Registering...' : 'Get API Access'}
                  </Button>
                  <div className="text-center text-sm text-neutral-500">
                    Already have a corporate account?{' '}
                    <Link className="text-lime-400 hover:underline font-medium" href="/login">
                      Login
                    </Link>
                  </div>
                </CardFooter>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

