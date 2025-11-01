import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const addItemSchema = z.object({
  symbol: z.string().min(1).max(20),
  assetType: z.enum(["stock", "etf", "crypto", "commodity", "bond"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { symbol, assetType } = addItemSchema.parse(body);

    // Check watchlist exists
    const watchlist = await prisma.watchlist.findUnique({
      where: { id },
    });

    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
    }

    // Check if item already exists
    const existing = await prisma.watchlistItem.findFirst({
      where: {
        watchlistId: id,
        symbol: symbol.toUpperCase(),
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Symbol already in watchlist" }, { status: 400 });
    }

    // Get max position
    const maxPosition = await prisma.watchlistItem.aggregate({
      where: { watchlistId: id },
      _max: { position: true },
    });

    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId: id,
        symbol: symbol.toUpperCase(),
        assetType,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json({
      id: item.id,
      symbol: item.symbol,
      assetType: item.assetType,
    });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Failed to add item" }, { status: 500 });
  }
}

