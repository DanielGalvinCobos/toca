import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOCA",
  description: "Todo tu negocio. En un toque.",
  icons: {
    icon: "/logo/toca-symbol.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}