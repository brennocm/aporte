"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Portfolio, Asset, AvailableAsset } from "@aporte/shared";

/**
 * Fetches all portfolios for the current authenticated user.
 */
export async function getPortfolios(): Promise<Portfolio[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const portfolios = await prisma.portfolio.findMany({
        where: { userId: session.user.id },
        include: { assets: true },
        orderBy: { updatedAt: "desc" },
    });

    return portfolios.map(p => ({
        id: p.id,
        userId: p.userId,
        name: p.name,
        description: p.description || undefined,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        assets: p.assets.map(a => ({
            id: a.id,
            portfolioId: a.portfolioId,
            ticker: a.ticker,
            targetWeight: a.targetWeight,
            quantity: a.quantity,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt
        }))
    }));
}

/**
 * Fetches a specific portfolio by ID, including its assets.
 * Validates ownership to prevent IDOR.
 */
export async function getPortfolioWithAssets(id: string): Promise<Portfolio | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    const portfolio = await prisma.portfolio.findUnique({
        where: {
            id,
            userId: session.user.id // Critical: IDOR Protection
        },
        include: { assets: true },
    });

    if (!portfolio) return null;

    return {
        id: portfolio.id,
        userId: portfolio.userId,
        name: portfolio.name,
        description: portfolio.description || undefined,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
        assets: portfolio.assets.map(a => ({
            id: a.id,
            portfolioId: a.portfolioId,
            ticker: a.ticker,
            targetWeight: a.targetWeight,
            quantity: a.quantity,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt
        }))
    };
}

/**
 * Creates a default portfolio for new users if they don't have one.
 */
export async function createDefaultPortfolioIfNone() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const existing = await prisma.portfolio.findFirst({
        where: { userId: session.user.id },
    });

    if (!existing) {
        return await prisma.portfolio.create({
            data: {
                userId: session.user.id,
                name: "My First Portfolio",
                description: "Initial portfolio created automatically.",
                assets: {
                    create: [
                        { ticker: "ITUB3", targetWeight: 0.5 },
                        { ticker: "VALE3", targetWeight: 0.5 },
                    ],
                },
            },
        });
    }
    return null;
}

/**
 * Creates a new portfolio for the current user.
 */
export async function createPortfolio(data: { name: string; description?: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await prisma.portfolio.create({
        data: {
            ...data,
            userId: session.user.id,
        },
    });
}

/**
 * Updates an existing portfolio's metadata.
 */
export async function updatePortfolio(id: string, data: { name: string; description?: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const portfolio = await prisma.portfolio.findUnique({ where: { id } });
    if (!portfolio || portfolio.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    return await prisma.portfolio.update({
        where: { id },
        data,
    });
}

/**
 * Deletes a portfolio and all its assets.
 */
export async function deletePortfolio(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const portfolio = await prisma.portfolio.findUnique({ where: { id } });
    if (!portfolio || portfolio.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    await prisma.portfolio.delete({
        where: { id },
    });
}

/**
 * Saves/Replaces all assets for a given portfolio.
 */
export async function savePortfolioAssets(portfolioId: string, assets: Pick<Asset, 'ticker' | 'targetWeight'>[]) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!portfolio || portfolio.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    // Replace all assets in a transaction
    return await prisma.$transaction([
        prisma.asset.deleteMany({ where: { portfolioId } }),
        prisma.portfolio.update({
            where: { id: portfolioId },
            data: {
                assets: {
                    create: assets,
                },
            },
            include: { assets: true },
        }),
    ]);
}

/**
 * Searches for available assets in the database by ticker or name.
 */
export async function searchAssets(query: string): Promise<AvailableAsset[]> {
    if (!query || query.length < 2) return [];

    try {
        const count = await prisma.availableAsset.count();
        if (count < 140) { // Sync if database has fewer than expected assets
            const { seedAvailableAssets } = await import("./seed-assets");
            await seedAvailableAssets();
        }

        const assets = await prisma.availableAsset.findMany({
            where: {
                OR: [
                    { ticker: { contains: query.toUpperCase() } },
                    { name: { contains: query } },
                ],
            },
            take: 10,
        });

        return assets.map(a => ({
            id: a.id,
            ticker: a.ticker,
            name: a.name,
            updatedAt: a.updatedAt
        }));
    } catch (error) {
        console.error(`[searchAssets] Error searching for "${query}":`, error);
        return [];
    }
}
