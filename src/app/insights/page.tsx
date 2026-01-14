import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { InsightsClient } from './insights-client';

export default async function InsightsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <InsightsClient />;
}
