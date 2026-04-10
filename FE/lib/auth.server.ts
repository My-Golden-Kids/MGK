import NextAuth, { type User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

async function readErrorBody(res: Response) {
  const contentType = res.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      return await res.json();
    }

    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: 'email-password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.SPRING_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const errorBody = await readErrorBody(res);
            console.error('[auth][email-password] authorize failed', {
              status: res.status,
              statusText: res.statusText,
              email: credentials.email,
              body: errorBody,
            });
            return null;
          }

          const data = await res.json();

          return {
            id: String(data.userId),
            email: data.email,
            name: data.name,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch (error) {
          console.error('[auth][email-password] authorize exception', {
            email: credentials.email,
            error,
          });
          return null;
        }
      },
    }),
    Credentials({
      id: 'magic-link',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        try {
          const res = await fetch(`${process.env.SPRING_API_URL}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: credentials.token as string,
          });

          if (!res.ok) {
            const errorBody = await readErrorBody(res);
            console.error('[auth][magic-link] authorize failed', {
              status: res.status,
              statusText: res.statusText,
              body: errorBody,
            });
            return null;
          }

          const data = await res.json();

          return {
            id: String(data.userId),
            email: data.email,
            name: data.name,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch (error) {
          console.error('[auth][magic-link] authorize exception', { error });
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as User;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.userId = String(u.id);
        token.name = u.name ?? null;
        token.accessTokenExpiry = Date.now() + 3600000 - 60_000;
        return token;
      }

      if (Date.now() < ((token.accessTokenExpiry as number) ?? 0)) {
        return token;
      }

      try {
        const res = await fetch(`${process.env.SPRING_API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token.refreshToken }),
        });

        if (!res.ok) throw new Error('refresh failed');

        const { accessToken } = await res.json();
        token.accessToken = accessToken;
        token.accessTokenExpiry = Date.now() + 3600000 - 60_000;
      } catch {
        return { ...token, error: 'RefreshTokenError' };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user = {
        ...session.user,
        id: token.userId,
        name: (token.name as string) ?? null,
      };

      if (token.error === 'RefreshTokenError') {
        (session as any).error = 'RefreshTokenError';
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
