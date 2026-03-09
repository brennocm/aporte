export const runtime = "nodejs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    // During build time, Next.js might run this code withoutenv vars loaded.
    // We provide a dummy secret ONLY for the build phase to avoid crashing.
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
        throw new Error("CRITICAL: AUTH_SECRET must be set and at least 32 chars in production.");
    } else if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE) {
        // We are in Next.js build phase, use a dummy secret
        process.env.AUTH_SECRET = "dummy_secret_for_build_phase_placeholder_32_chars";
    } else {
        console.warn("⚠️  AUTH_SECRET is missing or too short. Security is compromised.");
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Senha", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username as string },
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isValid) return null;

                return {
                    id: user.id,
                    username: user.username,
                    name: user.username, // Usar username como nome de exibição
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.name = token.name as string;
            }
            return session;
        },
    },
});
