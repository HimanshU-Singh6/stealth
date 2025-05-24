import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth'; // DefaultUser usually has id, name, email, image
import { JWT as DefaultJWT } from 'next-auth/jwt';     // DefaultJWT usually has name, email, picture, sub

declare module 'next-auth' {
  /**
   * The `user` object you get in the `session` callback and in `useSession()`
   */
  interface SessionUser { // Define a clear interface for your session user
    _id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null; // from DefaultSession.user
    role?: 'admin' | 'lessee';
    // id?: string; // from DefaultSession.user (NextAuth's default ID, usually mapped from token.sub or token.id)
  }

  interface Session {
    user: SessionUser; // Use the clear SessionUser interface
  }

  /**
   * The `user` object passed to the `jwt` callback on initial sign-in.
   * This should align with what your `authorize` function returns.
   */
  interface User extends DefaultUser { // DefaultUser has `id`. Your `authorize` returns an object with `_id`.
    _id?: string; // Your custom MongoDB ID
    role?: 'admin' | 'lessee';
    // Ensure other fields like name, email match what `authorize` returns.
  }
}

declare module 'next-auth/jwt' {
  /**
   * The token object passed to the `session` callback.
   * This is what you build in your `jwt` callback.
   */
  interface JWT extends DefaultJWT { // DefaultJWT has name, email, picture, sub
    _id?: string;
    role?: 'admin' | 'lessee';
    // Add other fields if you put them on the token
  }
}