import { NextRequest, NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getDemoUser();

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: "My Portfolio",
      },
    });

    return NextResponse.json({ id: portfolio.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to create portfolio" }, { status: 500 });
  }
}

