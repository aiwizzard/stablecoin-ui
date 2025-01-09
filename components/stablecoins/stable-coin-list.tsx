"use client";

import { useState, useEffect } from "react";
import { StablecoinInfo, stablebondService } from "@/lib/services/stablebond";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useWallet } from "@/lib/contexts/WalletContext";
import { PhantomWalletAdapter } from "@/lib/adapters/PhantomWalletAdapter";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function StablecoinList() {
  const { wallet, connection, isReady } = useWallet();
  const [stablecoins, setStablecoins] = useState<StablecoinInfo[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<StablecoinInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [actionType, setActionType] = useState<"mint" | "redeem" | null>(null);

  useEffect(() => {
    if (isReady) {
      loadStablecoins();
    }
  }, [isReady, connection]);

  const loadStablecoins = async () => {
    setIsLoadingCoins(true);
    try {
      const coins = await stablebondService.getStablecoins(connection);
      // Sort by creation date, newest first
      coins.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setStablecoins(coins);
    } catch {
      toast.error("Failed to load stablecoins");
    } finally {
      setIsLoadingCoins(false);
    }
  };

  const handleAction = async () => {
    if (!selectedCoin || !amount || !actionType || !wallet?.connected) return;

    // Validate amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // For redeem, check if user has enough tokens
    if (actionType === "redeem" && numAmount > Number(selectedCoin.totalSupply)) {
      toast.error(`You cannot redeem more than the total supply (${selectedCoin.totalSupply} ${selectedCoin.symbol})`);
      return;
    }

    setIsLoading(true);
    try {
      const walletAdapter = PhantomWalletAdapter.fromPhantomWallet(wallet);
      const result = actionType === "mint" 
        ? await stablebondService.mintTokens(
            connection,
            selectedCoin.id,
            amount,
            walletAdapter
          )
        : await stablebondService.redeemTokens(
            connection,
            selectedCoin.id,
            amount,
            walletAdapter
          );

      if (result.success) {
        toast.success(`Successfully ${actionType}ed tokens`);
        loadStablecoins();
        setAmount("");
        setSelectedCoin(null);
        setActionType(null);
      } else {
        toast.error(result.error || `Failed to ${actionType} tokens`);
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openActionDialog = (coin: StablecoinInfo, type: "mint" | "redeem") => {
    if (!wallet?.connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    setSelectedCoin(coin);
    setActionType(type);
    setAmount("");
  };

  const renderMintDialog = (coin: StablecoinInfo) => (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Mint {coin.symbol}</DialogTitle>
        <DialogDescription>
          Mint new {coin.symbol} tokens using your yield-bearing tokens as collateral.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <Alert className="text-sm bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-500 [&>svg]:text-blue-600 dark:border-blue-500/30 dark:[&>svg]:text-blue-500">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your yield-bearing tokens will be locked as collateral. You can redeem them back by burning {coin.symbol} tokens.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Amount to Mint</Label>
            <HoverCard>
              <HoverCardTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Minting Information</p>
                  <p className="text-sm text-muted-foreground">
                    1 {coin.symbol} = 1 {coin.targetCurrency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your yield-bearing tokens will continue to earn yield while locked.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <Input
            type="number"
            placeholder={`Enter amount in ${coin.targetCurrency}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">
            You will receive: {amount ? `${amount} ${coin.symbol}` : `0 ${coin.symbol}`}
          </p>
        </div>

        <Alert variant="warning" className="text-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Make sure you have enough yield-bearing tokens in your wallet. This action cannot be undone.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleAction}
          disabled={isLoading || !amount}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Mint Tokens"
          )}
        </Button>
      </div>
    </DialogContent>
  );

  const renderRedeemDialog = (coin: StablecoinInfo) => (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Redeem {coin.symbol}</DialogTitle>
        <DialogDescription>
          Burn your {coin.symbol} tokens to get back your yield-bearing tokens.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Amount to Redeem</Label>
            <HoverCard>
              <HoverCardTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Redemption Information</p>
                  <p className="text-sm text-muted-foreground">
                    You will receive back your yield-bearing tokens plus any yield earned.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <Input
            type="number"
            placeholder={`Enter amount in ${coin.symbol}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            max={coin.totalSupply}
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">
            Available balance: {Number(coin.totalSupply).toLocaleString()} {coin.symbol}
          </p>
        </div>

        <Button
          onClick={handleAction}
          disabled={isLoading || !amount}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Redeem Tokens"
          )}
        </Button>
      </div>
    </DialogContent>
  );

  if (!isReady) {
    return null;
  }

  if (isLoadingCoins) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (stablecoins.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-4 sm:py-6">
          <p className="text-muted-foreground text-sm sm:text-base">
            No stablecoins found. Create one to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {stablecoins.map((coin) => (
        <Card key={coin.id} className="flex flex-col">
          <CardHeader className="flex-none pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {coin.icon && (
                <img
                  src={coin.icon}
                  alt={coin.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="truncate">{coin.name} ({coin.symbol})</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Created {formatDistanceToNow(coin.createdAt)} ago
            </p>
          </CardHeader>
          <CardContent className="flex-1 pt-3 border-t">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-muted-foreground">Target Currency</p>
                <p className="text-right font-medium">{coin.targetCurrency}</p>
                <p className="text-muted-foreground">Total Supply</p>
                <p className="text-right font-medium">{Number(coin.totalSupply).toLocaleString()} {coin.symbol}</p>
                <p className="text-muted-foreground">Mint Address</p>
                <p className="text-right font-medium truncate text-xs" title={coin.mintAddress}>
                  {coin.mintAddress}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[80px]"
                      onClick={() => openActionDialog(coin, "mint")}
                    >
                      Mint
                    </Button>
                  </DialogTrigger>
                  {renderMintDialog(coin)}
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[80px]"
                      onClick={() => openActionDialog(coin, "redeem")}
                    >
                      Redeem
                    </Button>
                  </DialogTrigger>
                  {renderRedeemDialog(coin)}
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 