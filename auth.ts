import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const isProd = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] authorize start", { emailType: typeof credentials?.email });
        const rawEmail = typeof credentials?.email === "string" ? credentials.email : null;
        const password = typeof credentials?.password === "string" ? credentials.password : null;
        if (!rawEmail || !password) {
          console.log("[auth] missing creds");
          return null;
        }
        const email = rawEmail.trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.log("[auth] no user for", email);
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        console.log("[auth] bcrypt compare", { valid });
        if (!valid) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
});
