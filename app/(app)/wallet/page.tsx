"use client";

import { useWallet } from "@/lib/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyIcon, ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function WalletPage() {
  const { wallet, isReady } = useWallet();

  const copyAddress = async () => {
    if (wallet?.publicKey) {
      await navigator.clipboard.writeText(wallet.publicKey.toBase58());
      toast.success("Address copied to clipboard!");
    }
  };

  const openExplorer = () => {
    if (wallet?.publicKey) {
      const explorerUrl = `https://explorer.solana.com/address/${wallet.publicKey.toBase58()}`;
      window.open(explorerUrl, "_blank");
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading wallet information...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <h1 className="text-3xl font-bold">Wallet Information</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>Your current wallet connection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge variant={wallet?.connected ? "secondary" : "destructive"}>
              {wallet?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {wallet?.connected && wallet.publicKey ? (
            <>
              <div className="space-y-2">
                <div className="font-medium">Wallet Address:</div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded-md flex-1 overflow-x-auto">
                    {wallet.publicKey.toBase58()}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyAddress}>
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={openExplorer}>
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                variant="destructive" 
                onClick={() => wallet.disconnect()}
                disabled={!wallet.connected}
              >
                Disconnect Wallet
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => wallet?.connect()} 
              disabled={wallet?.connecting}
            >
              {wallet?.connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
