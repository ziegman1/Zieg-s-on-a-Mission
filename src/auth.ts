import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: { id: string; email?: string | null; name?: string | null; image?: string | null; role: UserRole };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        try {
          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          });
          if (!user || !user.passwordHash) return null;
          if (user.role !== "ADMIN" && user.role !== "STAFF") return null;
          const ok = await compare(password, user.passwordHash);
          if (!ok) return null;
          return {
            id: user.id,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            role: user.role,
          };
        } catch (e) {
          console.error("[auth] credentials authorize failed:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as { id?: string; role?: UserRole }).id = user.id;
        (token as { id?: string; role?: UserRole }).role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as { id?: string; role?: UserRole };
        session.user.id = t.id ?? "";
        session.user.role = t.role ?? "CUSTOMER";
      }
      return session;
    },
  },
});

export function requireAdmin(session: { user?: { role?: string } } | null): boolean {
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}
