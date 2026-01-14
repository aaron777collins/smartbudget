import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BudgetWizard from '@/components/budgets/budget-wizard';

export default async function CreateBudgetPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6">
      <BudgetWizard />
    </div>
  );
}
