"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ISeriesApi } from "lightweight-charts";

export default function Page() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [symbol, setSymbol] = useState("AAPL");

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
      layout: { textColor: "#999" },
      grid: { horzLines: { visible: true }, vertLines: { visible: true } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    const series = chart.addCandlestickSeries();
    seriesRef.current = series;

    const handleResize = () =>
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Load candles whenever symbol changes
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/candles?symbol=${symbol}`);
      const json = await res.json();
      const data =
        json.candles?.map((d: any) => ({
          time: Math.floor(d.t / 1000),
          open: d.o,
          high: d.h,
          low: d.l,
          close: d.c,
        })) ?? [];
      seriesRef.current?.setData(data);
    })();
  }, [symbol]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Viper</h1>
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Type a symbol, e.g., AAPL"
        />
        <button className="border rounded px-3 py-2" onClick={() => setSymbol("BTC-USD")}>
          BTC-USD
        </button>
        <button className="border rounded px-3 py-2" onClick={() => setSymbol("AAPL")}>
          AAPL
        </button>
      </div>
      <div ref={containerRef} className="w-full rounded border" />
    </div>
  );
}
