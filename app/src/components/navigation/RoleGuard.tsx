import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { LoadingState } from '@/components/ui';
import { homeHrefForRole, useAuth } from '@/lib/auth';
import type { Role } from '@/lib/contracts';

/** Renders children only for a signed-in user with `role`; otherwise redirects to /login or their own home. */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { status, user } = useAuth();
  if (status === 'loading') return <LoadingState label="" />;
  if (status !== 'signed-in' || !user) return <Redirect href={{ pathname: '/login', params: { role } }} />;
  if (user.role !== role) return <Redirect href={homeHrefForRole(user.role)} />;
  return children;
}
