import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

const createAlertSchema = z.object({
  symbol: z.string().min(1).max(20),
  value: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, value } = createAlertSchema.parse(body);

    const user = await getDemoUser();

    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        symbol: symbol.toUpperCase(),
        ruleType: "price_cross",
        params: { value },
        channel: "inapp",
      },
    });

    return NextResponse.json({
      id: alert.id,
      symbol: alert.symbol,
      value,
    });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Failed to create alert" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getDemoUser();

    const alerts = await prisma.alert.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        events: {
          orderBy: { triggeredAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      alerts.map((alert: any) => ({
        id: alert.id,
        symbol: alert.symbol,
        value: (alert.params as any).value,
        lastSeenPrice: alert.lastSeenPrice ? Number(alert.lastSeenPrice) : null,
        recentEvents: alert.events.map((e: any) => ({
          id: e.id,
          price: Number(e.price),
          triggeredAt: e.triggeredAt.toISOString(),
        })),
      }))
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to fetch alerts" }, { status: 500 });
  }
}

