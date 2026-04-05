'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@/lib/api/sdk.gen';
import { client } from '@/lib/api/client.gen';

client.setConfig({ credentials: 'include' });

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import NoiseOverlay from '@/components/ui/NoiseOverlay';
import Navbar from '@/components/sections/Navbar';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showRegistered, setShowRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowRegistered(true);
    }
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setShowRegistered(false);
    try {
      const response = await Auth.login({
        body: {
          email: data.email,
          password: data.password,
        },
      });
      
      if (response.error) {
        // @ts-ignore
        const detail = response.error?.detail;
        const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Invalid credentials');
        setError(message);
        return;
      }
      
      const redirect = searchParams.get('redirect');
      router.push(redirect || '/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
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
                Welcome <span className="text-lime-400">Back</span>
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Log in to manage your site's accessibility
              </CardDescription>
            </CardHeader>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {showRegistered && (
                  <div className="rounded-xl bg-lime-400/10 border border-lime-400/20 p-4 text-sm text-lime-400 font-medium">
                    Account created successfully! Please log in.
                  </div>
                )}
                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-medium">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 ml-1" htmlFor="email">
                    Corporate Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="bg-neutral-950/50 border-neutral-800 focus:border-lime-400 transition-all text-white placeholder:text-neutral-700 h-12 rounded-xl"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-400 mt-1 ml-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <label className="text-sm font-medium text-neutral-300 ml-1" htmlFor="password">
                      Password
                    </label>
                    <Link className="text-xs text-neutral-500 hover:text-white transition-colors" href="#">
                      Forgot?
                    </Link>
                  </div>
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
                  className="w-full h-12 rounded-xl bg-lime-400 text-black font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_-5px_rgba(163,230,53,0.3)]" 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}
                </Button>
                <div className="text-center text-sm text-neutral-500">
                  New to Bariweb?{' '}
                  <Link className="text-lime-400 hover:underline font-medium" href="/register">
                    Create personal account
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

