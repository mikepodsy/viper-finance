import { NextRequest, NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import ky from "ky";

export async function GET(req: NextRequest) {
  try {
    const user = await getDemoUser();

    // Get all active alerts
    const alerts = await prisma.alert.findMany({
      where: { userId: user.id, isActive: true, ruleType: "price_cross" },
    });

    if (alerts.length === 0) {
      return NextResponse.json({ checked: 0, triggered: 0 });
    }

    // Get unique symbols
    const symbols = Array.from(new Set(alerts.map((a: any) => a.symbol))) as string[];

    // Fetch prices once for all symbols
    const pricePromises = symbols.map(async (symbol) => {
      try {
        const res = await ky
          .get(`${req.nextUrl.origin}/api/quote?symbol=${encodeURIComponent(symbol)}`)
          .json<{ last: number | null }>();
        return { symbol, price: res.last };
      } catch {
        return { symbol, price: null };
      }
    });

    const priceResults = await Promise.all(pricePromises);
    const priceMap = new Map(priceResults.map((r) => [r.symbol, r.price]));

    let triggered = 0;

    // Evaluate each alert
    for (const alert of alerts as any[]) {
      const currentPrice = priceMap.get(alert.symbol);
      if (currentPrice === null || currentPrice === undefined) continue;

      const targetValue = (alert.params as any).value;
      const lastSeen = alert.lastSeenPrice ? Number(alert.lastSeenPrice) : null;

      // Check if price crossed the threshold
      let crossed = false;
      if (lastSeen === null) {
        // First evaluation - use current price as baseline
        crossed = false;
      } else {
        // Check if price crossed from below to above or vice versa
        const wasBelow = lastSeen < targetValue;
        const isAbove = currentPrice >= targetValue;
        const wasAbove = lastSeen >= targetValue;
        const isBelow = currentPrice < targetValue;
        crossed = (wasBelow && isAbove) || (wasAbove && isBelow);
      }

      // Update last seen price
      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastSeenPrice: currentPrice },
      });

      // If crossed, create event
      if (crossed) {
        await prisma.alertEvent.create({
          data: {
            alertId: alert.id,
            price: currentPrice,
          },
        });
        triggered++;
      }
    }

    return NextResponse.json({
      checked: alerts.length,
      triggered,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to evaluate alerts" }, { status: 500 });
  }
}

