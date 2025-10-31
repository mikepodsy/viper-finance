import { NextRequest, NextResponse } from "next/server";
import ky from "ky";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const isCrypto = symbol.includes("-") || /^[A-Z0-9]+-USD$/.test(symbol);

    if (isCrypto) {
      // MVP mapping for a couple of coins. Add more as you go.
      const map: Record<string, string> = {
        "BTC-USD": "bitcoin",
        "ETH-USD": "ethereum",
      };
      const coin = map[symbol.toUpperCase()];
      if (!coin) {
        return NextResponse.json({ error: "coin not mapped in MVP" }, { status: 400 });
      }

      const res = await ky
        .get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`)
        .json<any>();

      return NextResponse.json({
        symbol,
        last: res[coin]?.usd ?? null,
        provider: "coingecko",
      });
    }

    // Stocks/ETFs via Finnhub
    const key = process.env.FINNHUB_API_KEY!;
    const quote = await ky
      .get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`)
      .json<any>();

    return NextResponse.json({
      symbol,
      last: quote.c ?? null,
      change: quote.d ?? null,
      changePct: quote.dp ?? null,
      provider: "finnhub",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "fetch failed" }, { status: 500 });
  }
}
