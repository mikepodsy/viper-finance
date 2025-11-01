"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api-client";
import { ToastContainer, type Toast } from "@/components/toast";

type Alert = {
  id: string;
  symbol: string;
  value: number;
  lastSeenPrice: number | null;
  recentEvents: {
    id: string;
    price: number;
    triggeredAt: string;
  }[];
};

const alertSchema = z.object({
  symbol: z.string().min(1).max(20),
  value: z.number().positive(),
});

type AlertFormData = z.infer<typeof alertSchema>;

export default function AlertsPage() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: () => api.get("alerts").json(),
    refetchInterval: 30000,
  });

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: AlertFormData) =>
      api.post("alerts", { json: data }).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      reset();
      setToasts([...toasts, { id: Date.now().toString(), message: "Alert created", type: "success" }]);
    },
    onError: (e: any) => {
      const message = e?.response?.json?.()?.then?.((d: any) => d.error) || "Failed to create alert";
      setToasts([...toasts, { id: Date.now().toString(), message, type: "error" }]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`alerts/${id}`).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setToasts([...toasts, { id: Date.now().toString(), message: "Alert deleted", type: "success" }]);
    },
  });

  const onSubmit = (data: AlertFormData) => {
    createMutation.mutate(data);
  };

  const removeToast = (id: string) => {
    setToasts(toasts.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Alerts</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Set price alerts for your investments</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Alert</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Symbol</label>
              <input
                {...register("symbol")}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800"
                placeholder="AAPL"
              />
              {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol.message}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Price Threshold ($)</label>
              <input
                type="number"
                step="0.01"
                {...register("value", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800"
                placeholder="150.00"
              />
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {createMutation.isPending ? "Creating..." : "Create Alert"}
            </button>
          </form>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Alert will trigger when price crosses this threshold
          </p>
        </div>

        <div className="space-y-4">
          {alerts?.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold font-mono mb-2">{alert.symbol}</h3>
                  <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <div>
                      <span className="font-medium">Threshold:</span> ${alert.value.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Last seen:</span>{" "}
                      {alert.lastSeenPrice !== null ? `$${alert.lastSeenPrice.toFixed(2)}` : "N/A"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(alert.id)}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete
                </button>
              </div>

              {alert.recentEvents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300">Recent Triggers</h4>
                  <div className="space-y-2">
                    {alert.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                      >
                        <span className="font-mono font-semibold text-lg">${event.price.toFixed(2)}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(event.triggeredAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {alert.recentEvents.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No triggers yet</p>
              )}
            </div>
          ))}
          {alerts?.length === 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 dark:text-zinc-400">
              <div className="text-4xl mb-2">🔔</div>
              <p>No alerts yet. Create one above.</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

