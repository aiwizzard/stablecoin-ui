"use client";

import { useState } from "react";
import { stablebondService } from "@/lib/services/stablebond";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useWallet } from "@/lib/contexts/WalletContext";
import { PhantomWalletAdapter } from "@/lib/adapters/PhantomWalletAdapter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD"];

export function StablecoinForm({ onSuccess }: { onSuccess?: () => void }) {
  const { wallet, connection, isReady } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    icon: "",
    targetCurrency: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet?.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);

    try {
      const walletAdapter = PhantomWalletAdapter.fromPhantomWallet(wallet);
      const result = await stablebondService.createStablecoin(connection, {
        ...formData,
        payer: walletAdapter,
      });

      if (result.success) {
        toast.success("Stablecoin created successfully!");
        setFormData({
          name: "",
          symbol: "",
          icon: "",
          targetCurrency: "",
        });
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create stablecoin");
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isReady) {
    return null;
  }

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Create New Stablecoin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Name</Label>
            <Input
              id="name"
              placeholder="e.g., USD Coin"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-9 sm:h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-sm">Symbol</Label>
            <Input
              id="symbol"
              placeholder="e.g., USDC"
              value={formData.symbol}
              onChange={(e) => handleChange("symbol", e.target.value.toUpperCase())}
              className="h-9 sm:h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon" className="text-sm">Icon URL</Label>
            <Input
              id="icon"
              type="url"
              placeholder="https://example.com/icon.png"
              value={formData.icon}
              onChange={(e) => handleChange("icon", e.target.value)}
              className="h-9 sm:h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCurrency" className="text-sm">Target Currency</Label>
            <Select
              value={formData.targetCurrency}
              onValueChange={(value) => handleChange("targetCurrency", value)}
            >
              <SelectTrigger className="h-9 sm:h-10">
                <SelectValue placeholder="Select target currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Alert variant="warning" className="mt-6 text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Creating a stablecoin requires a transaction fee. Make sure you have enough SOL in your wallet.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            className="w-full h-9 sm:h-10 mt-6"
            disabled={isLoading || !formData.name || !formData.symbol || !formData.icon || !formData.targetCurrency}
          >
            {isLoading ? "Creating..." : "Create Stablecoin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 