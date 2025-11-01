import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = createSchema.parse(body);

    const user = await getDemoUser();

    const watchlist = await prisma.watchlist.create({
      data: {
        userId: user.id,
        name,
      },
    });

    return NextResponse.json({ id: watchlist.id });
  } catch (e: any) {
    if (e.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Failed to create watchlist" }, { status: 500 });
  }
}

