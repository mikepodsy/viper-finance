import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const addLotSchema = z.object({
  symbol: z.string().min(1).max(20),
  qty: z.number().positive(),
  costBasis: z.number().nonnegative(),
  tradeDate: z.string().datetime(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = addLotSchema.parse(body);

    // Check portfolio exists
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const lot = await prisma.lot.create({
      data: {
        portfolioId: id,
        symbol: parsed.symbol.toUpperCase(),
        qty: parsed.qty,
        costBasis: parsed.costBasis,
        tradeDate: new Date(parsed.tradeDate),
      },
    });

    return NextResponse.json({
      id: lot.id,
      symbol: lot.symbol,
      qty: Number(lot.qty),
      costBasis: Number(lot.costBasis),
      tradeDate: lot.tradeDate.toISOString(),
    });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Failed to add lot" }, { status: 500 });
  }
}

