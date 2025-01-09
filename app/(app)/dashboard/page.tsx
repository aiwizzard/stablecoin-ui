"use client";

import { StablecoinForm } from "@/components/stablecoins/stable-coin-form";
import { StablecoinList } from "@/components/stablecoins/stable-coin-list";
import { useWallet } from "@/lib/contexts/WalletContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PhantomIcon } from "@/components/icons/phantom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PhantomWindow extends Window {
  solana?: {
    isPhantom?: boolean;
  };
}

export default function StablecoinsPage() {
  const { wallet, isReady } = useWallet();
  const [hasPhantom, setHasPhantom] = useState<boolean | null>(null);

  useEffect(() => {
    const checkForPhantom = () => {
      if (typeof window === 'undefined') return;
      const isPhantomInstalled = "solana" in window && (window as PhantomWindow).solana?.isPhantom;
      setHasPhantom(!!isPhantomInstalled);
    };

    checkForPhantom();
    window.addEventListener("focus", checkForPhantom);
    return () => window.removeEventListener("focus", checkForPhantom);
  }, []);

  const handleConnect = async () => {
    if (!hasPhantom) {
      window.open("https://phantom.app/", "_blank");
      return;
    }

    try {
      await wallet?.connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  if (!isReady) {
    return null;
  }

  if (!wallet?.connected) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Welcome to Stablecoins</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
              Create and manage your stablecoins. Each stablecoin is backed by yield-bearing tokens.
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 w-full max-w-md">
                <PhantomIcon className="h-8 w-8 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <h3 className="font-semibold truncate">Phantom Wallet</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {hasPhantom 
                      ? "Connect to get started"
                      : "Install Phantom to get started"}
                  </p>
                </div>
                <Button 
                  onClick={handleConnect}
                  variant={hasPhantom ? "default" : "secondary"}
                  className="flex-shrink-0"
                >
                  {hasPhantom ? "Connect" : "Install"}
                </Button>
              </div>
              {!hasPhantom && (
                <p className="text-sm text-muted-foreground">
                  After installing Phantom, please refresh this page.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Alert variant="warning" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Security Notice</AlertTitle>
          <AlertDescription className="text-sm mt-1">
            Always verify transaction details before signing. Never share your private keys or seed phrase.
            This app will never ask for your seed phrase.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Stablecoins</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Create and manage your stablecoins. Each stablecoin is backed by yield-bearing tokens.
        </p>
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <StablecoinForm />
        </div>
        <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
          <h2 className="text-lg sm:text-xl font-semibold">Your Stablecoins</h2>
          <StablecoinList />
        </div>
      </div>

      <Alert variant="warning" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Transaction Security</AlertTitle>
        <AlertDescription className="text-sm mt-1">
          Always review transaction details in your Phantom wallet before signing. 
          Check token amounts and addresses carefully.
        </AlertDescription>
      </Alert>
    </div>
  );
} 