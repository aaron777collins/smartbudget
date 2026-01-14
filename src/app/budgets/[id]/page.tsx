import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BudgetDetailClient from './budget-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BudgetDetailPage({ params }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  return <BudgetDetailClient budgetId={id} />;
}
