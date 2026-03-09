"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UserSettings } from "@aporte/shared";
import { z } from "zod";

const settingsSchema = z.object({
    defaultCurrency: z.string().optional(),
    contributionFrequency: z.string().optional(),
    defaultContribution: z.number().min(0).optional(),
    dripEnabled: z.boolean().optional(),
    b3Strict: z.boolean().optional(),
    discountInflation: z.boolean().optional(),
    defaultBenchmark: z.string().optional(),
});

/**
 * Retrieves the current user's settings, creating defaults if necessary.
 */
export async function getUserSettings(): Promise<UserSettings | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    let settings = await prisma.setting.findUnique({
        where: { userId: session.user.id },
    });

    if (!settings) {
        settings = await prisma.setting.create({
            data: {
                userId: session.user.id,
                defaultCurrency: "BRL",
                contributionFrequency: "monthly",
                defaultContribution: 1000,
                dripEnabled: true,
                b3Strict: true,
                discountInflation: false,
                defaultBenchmark: "CDI",
            },
        });
    }

    return {
        id: settings.id,
        userId: settings.userId,
        defaultCurrency: settings.defaultCurrency,
        contributionFrequency: settings.contributionFrequency,
        defaultContribution: settings.defaultContribution,
        dripEnabled: settings.dripEnabled,
        b3Strict: settings.b3Strict,
        discountInflation: settings.discountInflation,
        defaultBenchmark: settings.defaultBenchmark,
        updatedAt: settings.updatedAt
    };
}

/**
 * Updates the existing user settings.
 */
export async function updateUserSettings(data: Partial<Omit<UserSettings, 'id' | 'userId' | 'updatedAt'>>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const parsed = settingsSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error("Invalid settings data: " + parsed.error.message);
    }
    const validData = parsed.data;

    await prisma.setting.upsert({
        where: { userId: session.user.id },
        update: validData,
        create: {
            userId: session.user.id,
            defaultCurrency: "BRL",
            contributionFrequency: "monthly",
            defaultContribution: 1000,
            dripEnabled: true,
            b3Strict: true,
            discountInflation: false,
            defaultBenchmark: "CDI",
            ...validData,
        },
    });

    revalidatePath("/settings");
    revalidatePath("/simulation");
}
