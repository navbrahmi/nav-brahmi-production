import React from 'react';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { AdminLogin } from './admin-login';
import { AdminPanel } from './admin-panel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const isAuth = await isAuthenticatedAdmin();

  if (!isAuth) {
    return <AdminLogin />;
  }

  return <AdminPanel />;
}

