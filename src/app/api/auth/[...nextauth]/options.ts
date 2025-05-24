import { NextAuthOptions, User as NextAuthUser } from 'next-auth'; // Import NextAuthUser for clarity
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel, { IUser as AppUser } from '@/models/User'; // Your Mongoose User model/interface

interface Credentials {
  email?: string;
  password?: string;
  // Add any other credential fields you expect (e.g., identifier)
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'john.doe@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentialsInput): Promise<NextAuthUser | null> { // Return type should align with NextAuth's User
        const credentials = credentialsInput as Credentials; // Cast to your defined Credentials type
        await dbConnect();
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password required');
          }

          const userFromDb = await UserModel.findOne({ email: credentials.email }).select('+password');

          if (!userFromDb) {
            throw new Error('No user found with this email');
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            userFromDb.password
          );

          if (isPasswordCorrect) {
            // Map your DB user to the structure NextAuth expects for its User type
            // and include your custom fields.
            return {
              id: userFromDb._id.toString(), // NextAuth often expects `id` from authorize.
              _id: userFromDb._id.toString(), // Your custom field
              email: userFromDb.email,
              name: userFromDb.name,
              role: userFromDb.role,
              // image: userFromDb.image, // if you have it
            } as NextAuthUser & AppUser; // Cast to a merged type
          } else {
            throw new Error('Incorrect password');
          }
        } catch (err) {
          const error = err as Error;
          console.error("Authorize error:", error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // `user` is passed on initial sign-in. It's the object from `authorize`.
      if (user) {
        // The `user` object from `authorize` should already have _id and role.
        // The type of `user` here is NextAuth's `User` type, which you've augmented.
        token._id = user._id;      // user._id should exist due to augmentation and authorize return
        token.role = user.role;    // user.role should exist
        token.name = user.name;
        token.email = user.email;
        // token.picture = user.image; // Default JWT uses 'picture' for image
      }
      return token;
    },
    async session({ session, token }) {
      // The token object has _id and role from the jwt callback.
      // We need to ensure all properties defined in `next-auth.d.ts` for `session.user` are populated.
      if (token && session.user) { // Check if session.user exists
        session.user._id = token._id as string | undefined;
        session.user.role = token.role as 'admin' | 'lessee' | undefined;
        session.user.name = token.name as string | null | undefined;
        session.user.email = token.email as string | null | undefined;
        // session.user.image = token.picture as string | null | undefined; // if you use image/picture

        // Ensure all properties from DefaultSession['user'] are also handled
        // or are implicitly covered by the spread in next-auth.d.ts.
        // NextAuth's DefaultSession['user'] has name, email, image. We've explicitly set them.
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/signin',
  },
};