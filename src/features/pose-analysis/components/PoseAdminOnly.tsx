import React from 'react';
import type { Account } from '../../../components/AccountGate';

// UI-only diagnostics: URL/localStorage preferences never grant access.
export function PoseAdminOnly({ user, loading, children }: {
  user: Pick<Account, 'role'> | null;
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading || user?.role !== 'admin') return null;
  return <>{children}</>;
}
