import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BudgetsClient from './budgets-client';

export default async function BudgetsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <BudgetsClient />;
}
