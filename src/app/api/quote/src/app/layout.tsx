import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viper",
  description: "Multi-asset portfolio & charts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
