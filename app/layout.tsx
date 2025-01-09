import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { WalletProvider } from "@/lib/contexts/WalletContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stablecoin UI",
  description: "Create and manage your stablecoins",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
