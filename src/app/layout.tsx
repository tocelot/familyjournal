import type { Metadata } from "next";
import { Caveat, Funnel_Sans } from "next/font/google";
import "./globals.css";

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  display: "swap",
});

const funnelSans = Funnel_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lai Family Logbook",
  description: "A family scrapbook for Asher and Aiden",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${caveat.variable} ${funnelSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
