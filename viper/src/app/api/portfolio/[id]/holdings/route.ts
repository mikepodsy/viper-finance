import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ky from "ky";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: { lots: true },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Aggregate lots by symbol
    const aggregated = new Map<
      string,
      { qty: number; totalCost: number; totalFees: number }
    >();

    for (const lot of portfolio.lots) {
      const symbol = lot.symbol;
      const qty = Number(lot.qty);
      const costBasis = Number(lot.costBasis);
      const fee = Number(lot.fee);

      if (!aggregated.has(symbol)) {
        aggregated.set(symbol, { qty: 0, totalCost: 0, totalFees: 0 });
      }

      const agg = aggregated.get(symbol)!;
      agg.qty += qty;
      agg.totalCost += qty * costBasis;
      agg.totalFees += Number(fee);
    }

    // Fetch prices for all unique symbols
    const symbols = Array.from(aggregated.keys());
    const pricePromises = symbols.map(async (symbol) => {
      try {
        const res = await ky
          .get(`${req.nextUrl.origin}/api/quote?symbol=${encodeURIComponent(symbol)}`)
          .json<{ last: number | null }>();
        return { symbol, price: res.last ?? 0 };
      } catch {
        return { symbol, price: 0 };
      }
    });

    const prices = await Promise.all(pricePromises);
    const priceMap = new Map(prices.map((p) => [p.symbol, p.price]));

    // Calculate holdings
    const holdings = Array.from(aggregated.entries()).map(([symbol, agg]) => {
      const qty = agg.qty;
      const avgCost = qty > 0 ? agg.totalCost / qty : 0;
      const marketPrice = priceMap.get(symbol) ?? 0;
      const marketValue = qty * marketPrice;
      const unrealizedPL = marketValue - agg.totalCost;
      const unrealizedPLPct = agg.totalCost > 0 ? (unrealizedPL / agg.totalCost) * 100 : 0;

      return {
        symbol,
        qty,
        avgCost,
        marketValue,
        unrealizedPL,
        unrealizedPLPct,
      };
    });

    // Calculate totals
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.qty * h.avgCost, 0);
    const totalUnrealizedPL = totalValue - totalCost;
    const totalUnrealizedPLPct = totalCost > 0 ? (totalUnrealizedPL / totalCost) * 100 : 0;

    return NextResponse.json({
      holdings,
      totals: {
        totalValue,
        totalUnrealizedPL,
        totalUnrealizedPLPct,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to fetch holdings" }, { status: 500 });
  }
}

