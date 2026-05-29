import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import { AccessGate } from '@/components/AccessGate';
import { GemHelper } from '@/components/GemHelper';
import { getAllGems } from '@/lib/gemBuilder';

export const dynamic = 'force-dynamic';

export default async function GemsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/');
  const gems = getAllGems();
  return (
    <AccessGate>
      <GemHelper gems={gems} />
    </AccessGate>
  );
}
