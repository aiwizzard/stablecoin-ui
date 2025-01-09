"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { env } from "@/lib/env.mjs";
import { toast } from "sonner";

interface Wallet {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnect: () => Promise<void>;
  connect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

interface PhantomWindow extends Window {
  solana?: {
    connect: (options?: { onlyIfTrusted: boolean }) => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
    publicKey: PublicKey | null;
    isPhantom?: boolean;
    on: (event: string, callback: () => void) => void;
    removeListener: (event: string, callback: () => void) => void;
  };
}

const WalletContext = createContext<{
  wallet: Wallet | null;
  connection: Connection;
  isReady: boolean;
}>({
  wallet: null,
  connection: new Connection(env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com"),
  isReady: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isReady, setIsReady] = useState(false);
  const connection = new Connection(env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com");

  useEffect(() => {
    const checkForPhantom = async () => {
      try {
        const win = window as PhantomWindow;
        
        if ("solana" in win && win.solana?.isPhantom) {
          const solana = win.solana;
          
          // Try to reconnect if previously connected
          try {
            await solana.connect({ onlyIfTrusted: true });
            toast.success("Wallet reconnected!");
          } catch {
            // User hasn't previously connected, do nothing
          }

          const handleAccountChange = () => {
            setWallet(prev => 
              prev ? { ...prev, publicKey: solana.publicKey, connected: !!solana.publicKey } : null
            );
          };

          const handleDisconnect = () => {
            setWallet(prev => prev ? { ...prev, publicKey: null, connected: false } : null);
            toast.info("Wallet disconnected");
          };

          // Add listeners for account changes and disconnection
          solana.on("accountChanged", handleAccountChange);
          solana.on("disconnect", handleDisconnect);
          
          const phantomWallet: Wallet = {
            publicKey: solana.publicKey,
            connected: !!solana.publicKey,
            connecting: false,
            disconnect: async () => {
              try {
                await solana.disconnect();
                setWallet(prev => prev ? { ...prev, publicKey: null, connected: false } : null);
                toast.success("Wallet disconnected successfully");
              } catch (error) {
                console.error("Failed to disconnect wallet:", error);
                toast.error("Failed to disconnect wallet");
              }
            },
            connect: async () => {
              try {
                setWallet(prev => prev ? { ...prev, connecting: true } : null);
                const { publicKey } = await solana.connect();
                setWallet(prev => 
                  prev ? { ...prev, publicKey, connected: true, connecting: false } : null
                );
              } catch (error) {
                console.error("Failed to connect wallet:", error);
                setWallet(prev => prev ? { ...prev, connecting: false } : null);
                throw error;
              }
            },
            signTransaction: solana.signTransaction.bind(solana),
            signAllTransactions: solana.signAllTransactions.bind(solana),
          };

          setWallet(phantomWallet);

          // Cleanup function to remove listeners
          return () => {
            solana.removeListener("accountChanged", handleAccountChange);
            solana.removeListener("disconnect", handleDisconnect);
          };
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
      } finally {
        setIsReady(true);
      }
    };

    checkForPhantom();
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, connection, isReady }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
} 