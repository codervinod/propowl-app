import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Lazy import to handle build-time when DATABASE_URL is not set
const getDb = async () => {
  const { db } = await import("@/db");
  return db;
};

const getUsers = async () => {
  const { users } = await import("@/db/schema");
  return users;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const getDbSync = () => (process.env.DATABASE_URL ? require("@/db").db : null);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: process.env.DATABASE_URL
    ? DrizzleAdapter(getDbSync())
    : undefined,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
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

        const db = await getDb();
        const users = await getUsers();

        if (!db) {
          throw new Error("Database not configured");
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user[0] || !user[0].password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user[0].password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
        };
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
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
