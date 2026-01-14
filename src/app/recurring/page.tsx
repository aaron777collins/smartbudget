import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RecurringClient from './recurring-client';

export default async function RecurringPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return <RecurringClient />;
}
