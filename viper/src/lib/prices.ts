import ky from "ky";

export async function getLastPrice(symbol: string): Promise<number | null> {
  try {
    const res = await ky.get(`/api/quote?symbol=${encodeURIComponent(symbol)}`).json<{
      last: number | null;
    }>();
    return res.last;
  } catch (e) {
    console.error("Failed to fetch price for", symbol, e);
    return null;
  }
}

