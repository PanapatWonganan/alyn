import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        if ((user as unknown as { isBanned?: boolean }).isBanned) {
          throw new Error("บัญชีนี้ถูกระงับการใช้งาน");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          penName: user.penName,
          avatar: user.avatar,
          coinBalance: user.coinBalance,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        const u = user as unknown as Record<string, unknown>;
        token.role = u.role as string;
        token.penName = u.penName as string | null;
        token.coinBalance = u.coinBalance as number;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const user = session.user as unknown as Record<string, unknown>;
        user.role = token.role;
        user.penName = token.penName;
        user.coinBalance = token.coinBalance;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});
