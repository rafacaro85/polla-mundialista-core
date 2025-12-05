'use client';
import React from 'react';
import { DashboardClient } from '@/components/DashboardClient';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  return (
    <>
      <DashboardClient />
      <Toaster />
    </>
  );
}
