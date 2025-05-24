import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      _id?: string;
      role?: 'admin' | 'lessee';
      name?: string | null; // Add name here if you want it
    } & DefaultSession['user']; // Keep existing properties like email, image
  }

  interface User extends DefaultUser { // DefaultUser has id, name, email, image
    _id?: string;
    role?: 'admin' | 'lessee';
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT { // DefaultJWT has name, email, picture, sub
    _id?: string;
    role?: 'admin' | 'lessee';
  }
}