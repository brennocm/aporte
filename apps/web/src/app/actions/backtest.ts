"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Backtest } from "@aporte/shared";

/**
 * Fetches the backtest history for the current authenticated user.
 */
export async function getBacktestHistory(): Promise<Backtest[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const history = await prisma.backtest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return history.map(h => ({
        id: h.id,
        userId: h.userId,
        name: h.name,
        startDate: h.startDate,
        endDate: h.endDate,
        cagr: h.cagr,
        maxDrawdown: h.maxDrawdown,
        sharpeRatio: h.sharpeRatio || undefined,
        totalValue: h.totalValue,
        totalInvested: h.totalInvested,
        portfolioId: h.portfolioId || undefined,
        initialCapital: h.initialCapital || undefined,
        monthlyContribution: h.monthlyContribution || undefined,
        createdAt: h.createdAt
    }));
}

/**
 * Saves a new backtest result to the database.
 */
export async function saveBacktestResult(data: Omit<Backtest, 'id' | 'userId' | 'createdAt'>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const backtest = await prisma.backtest.create({
        data: {
            ...data,
            userId: session.user.id,
        },
    });

    revalidatePath("/backtests");
    return backtest;
}

/**
 * Deletes a backtest entry if it belongs to the authenticated user.
 */
export async function deleteBacktest(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const backtest = await prisma.backtest.findUnique({ where: { id } });
    if (!backtest || backtest.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    await prisma.backtest.delete({
        where: { id },
    });

    revalidatePath("/backtests");
}
