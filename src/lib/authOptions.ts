import type { AuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const base = process.env.NEXTAUTH_URL ?? '';
      try {
        await fetch(`${base}/api/lead/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'login',
            email: user.email,
            name: user.name ?? '',
            picture: user.image ?? '',
          }),
        });
      } catch (e) {
        console.warn('[lead/track] login failed', e);
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) (session.user as any).id = token.sub;
      return session;
    },
  },
};
