import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lotId: string }> }
) {
  try {
    const { lotId } = await params;

    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    await prisma.lot.delete({
      where: { id: lotId },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to delete lot" }, { status: 500 });
  }
}

