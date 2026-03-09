"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export type RegisterResult = {
    success: boolean;
    error?: string;
};

export async function registerUser(formData: FormData): Promise<RegisterResult> {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { success: false, error: "Usuário e senha são obrigatórios." };
    }

    if (password.length < 8) {
        return { success: false, error: "A senha deve ter pelo menos 8 caracteres." };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            // Provide specific feedback for username already taken
            return { success: false, error: "Este nome de usuário já está em uso." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Register error:", error);
        return { success: false, error: "Erro interno ao criar conta. Tente novamente." };
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn("credentials", {
            username: formData.get("username"),
            password: formData.get("password"),
            redirectTo: "/portfolios",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Usuário ou senha incorretos.";
                default:
                    return "Erro interno de autenticação.";
            }
        }
        throw error;
    }
}
