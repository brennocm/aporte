import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

const simulateSchema = z.object({
    portfolio_id: z.string().uuid(),
    assets: z.array(z.object({
        ticker: z.string().min(1),
        target_weight: z.number().min(0).max(1)
    })).min(1),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    initial_capital: z.number().min(0),
    monthly_contribution: z.number().min(0),
    drip_enabled: z.boolean(),
    b3_strict: z.boolean(),
    inflation_adjusted: z.boolean(),
    benchmark: z.string().optional(),
    contribution_frequency: z.string().optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const result = simulateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({
                error: "Invalid input data",
                details: result.error.issues
            }, { status: 400 });
        }

        const {
            portfolio_id, assets, start_date, end_date,
            initial_capital, monthly_contribution,
            drip_enabled, b3_strict, inflation_adjusted,
            benchmark, contribution_frequency
        } = result.data;

        const engineUrl = process.env.MATH_ENGINE_URL || "http://math-engine:8000";

        const response = await fetch(`${engineUrl}/simulate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                portfolio_id,
                assets,
                start_date,
                end_date: end_date || null,
                initial_capital,
                monthly_contribution,
                drip_enabled,
                b3_strict,
                inflation_adjusted,
                benchmark,
                contribution_frequency
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.detail || errorData.error || "Simulation engine error";
            console.error("Math engine error:", errorMsg);
            return NextResponse.json({ error: errorMsg }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("BFF Critical Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown";
        return NextResponse.json(
            { error: `Internal BFF error: ${errorMessage}` },
            { status: 500 }
        );
    }
}
