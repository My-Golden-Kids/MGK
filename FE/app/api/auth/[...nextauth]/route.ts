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
    // 이메일/비밀번호 로그인
    Credentials({
      id: 'email-password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Spring AuthController: POST /api/auth/login
          // Request:  { email: string, password: string }
          // Response: { accessToken, refreshToken, userId, email, name }
          const res = await fetch(
            `${process.env.SPRING_API_URL}/api/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            },
          );

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

    // 매직링크 토큰 검증
    Credentials({
      id: 'magic-link',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        try {
          // Spring AuthController: POST /api/auth/verify
          // BE: @RequestBody String token → raw text/plain 으로 전송해야 함
          // Request:  raw string (UUID token)
          // Response: { accessToken, refreshToken, userId, email, name }
          const res = await fetch(
            `${process.env.SPRING_API_URL}/api/auth/verify`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: credentials.token as string,
            },
          );

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
      // 로그인 직후에만 user가 존재 → Spring 토큰을 JWT에 저장
      if (user) {
        const u = user as User;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.userId = String(u.id);
        token.name = u.name ?? null;
        // accessToken 만료 시각 저장 (security.yml access-expiration: 3600000ms = 1h)
        // 60초 여유를 두고 만료 처리
        token.accessTokenExpiry = Date.now() + 3600000 - 60_000;
        return token;
      }

      // accessToken 아직 유효하면 refresh 건너뜀
      if (Date.now() < ((token.accessTokenExpiry as number) ?? 0)) {
        return token;
      }

      // Spring AuthController: POST /api/auth/refresh
      // Request:  { refreshToken: string }
      // Response: { accessToken: string }
      try {
        const res = await fetch(
          `${process.env.SPRING_API_URL}/api/auth/refresh`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: token.refreshToken }),
          },
        );

        if (!res.ok) throw new Error('refresh failed');

        const { accessToken, refreshToken } = await res.json();
        token.accessToken = accessToken;
        token.refreshToken = refreshToken;
        token.accessTokenExpiry = Date.now() + 3600000 - 60_000;
      } catch {
        // refresh 실패 → 세션 무효화 (다음 auth() 호출 시 null 반환)
        return { ...token, error: 'RefreshTokenError' as const };
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
        // 클라이언트에서 useSession()으로 에러 감지 후 로그아웃 처리 가능
        session.error = 'RefreshTokenError';
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

export const { GET, POST } = handlers;
