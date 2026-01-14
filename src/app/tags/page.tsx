import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TagsClient from './tags-client';

export default async function TagsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return <TagsClient />;
}
