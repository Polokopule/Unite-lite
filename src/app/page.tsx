"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';

export default function Home() {
  const { user, loading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading is finished to prevent flicker
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // If user is not logged in, redirect to the login page
        router.replace('/login-user');
      }
    }
  }, [user, loading, router]);

  // Render a loading state while we determine where to redirect
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
