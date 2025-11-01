import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const watchlist = await prisma.watchlist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: watchlist.id,
      name: watchlist.name,
      items: watchlist.items.map((item: any) => ({
        id: item.id,
        symbol: item.symbol,
        assetType: item.assetType,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to fetch watchlist" }, { status: 500 });
  }
}

