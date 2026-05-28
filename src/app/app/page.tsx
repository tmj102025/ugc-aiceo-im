import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import { Builder } from '@/components/Builder';
import { AccessGate } from '@/components/AccessGate';

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/');
  return (
    <AccessGate>
      <Builder
        user={{
          email: session.user.email,
          name: session.user.name ?? '',
          picture: session.user.image ?? '',
        }}
      />
    </AccessGate>
  );
}
