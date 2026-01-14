import { GoalsClient } from './goals-client';

export const metadata = {
  title: 'Goals - SmartBudget',
  description: 'Track your financial goals and progress',
};

export default function GoalsPage() {
  return <GoalsClient />;
}
