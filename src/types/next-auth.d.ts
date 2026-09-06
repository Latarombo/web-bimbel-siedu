import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & { id: string; role: 'admin' | 'guru' | 'orang_tua' };
  }
  interface User {
    id: string;
    role: 'admin' | 'guru' | 'orang_tua';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'admin' | 'guru' | 'orang_tua';
  }
}
