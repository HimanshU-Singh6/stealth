import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect'; // Your existing DB connection
import User, { IUser } from '@/models/User'; // Your Mongoose User model

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials', // You can use any ID
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'john.doe@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect();
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password required');
          }

          const user = await User.findOne({ email: credentials.email }).select('+password'); // Ensure password is selected

          if (!user) {
            throw new Error('No user found with this email');
          }

          // If you haven't implemented password hashing yet, this is crucial!
          // For now, we'll assume the password in the DB is hashed.
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (isPasswordCorrect) {
            // Return user object without password
            const { password, ...userWithoutPassword } = user.toObject();
            return userWithoutPassword;
          } else {
            throw new Error('Incorrect password');
          }
        } catch (err: any) {
          // Log the error for debugging if needed
          console.error("Authorize error:", err.message);
          throw new Error(err.message || 'Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // The user object here is what was returned from the authorize callback
        token._id = (user as IUser)._id?.toString();
        token.email = (user as IUser).email;
        token.name = (user as IUser).name;
        token.role = (user as IUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as "admin" | "lessee";
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt', // Use JSON Web Tokens for sessions
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin', // Custom sign-in page (you'll create this)
    // error: '/auth/error', // (optional) Custom error page
  },
};