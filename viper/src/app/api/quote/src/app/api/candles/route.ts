import { NextRequest, NextResponse } from "next/server";
import ky from "ky";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const tf = searchParams.get("tf") ?? "1d";
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const isCrypto = symbol.includes("-") || /^[A-Z0-9]+-USD$/.test(symbol);

    if (isCrypto) {
      const map: Record<string, string> = {
        "BTC-USD": "bitcoin",
        "ETH-USD": "ethereum",
      };
      const coin = map[symbol.toUpperCase()];
      if (!coin) {
        return NextResponse.json({ error: "coin not mapped in MVP" }, { status: 400 });
      }

      // CoinGecko returns [timestamp, open, high, low, close]
      const raw = await ky
        .get(`https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=30`)
        .json<any[]>();

      const candles = raw.map(([t, o, h, l, c]) => ({ t, o, h, l, c, v: null }));
      return NextResponse.json({ symbol, tf, candles, provider: "coingecko" });
    }

    // Equities daily OHLCV for ~1 year via Finnhub
    const key = process.env.FINNHUB_API_KEY!;
    const now = Math.floor(Date.now() / 1000);
    const from = now - 60 * 60 * 24 * 365;

    const r = await ky
      .get(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${now}&token=${key}`
      )
      .json<any>();

    if (r.s !== "ok") return NextResponse.json({ error: "no candles" }, { status: 404 });

    const candles = r.t.map((t: number, i: number) => ({
      t: t * 1000,
      o: r.o[i],
      h: r.h[i],
      l: r.l[i],
      c: r.c[i],
      v: r.v?.[i] ?? null,
    }));

    return NextResponse.json({ symbol, tf, candles, provider: "finnhub" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "candles failed" }, { status: 500 });
  }
}
