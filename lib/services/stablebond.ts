import { 
  Connection, 
  PublicKey, 
  Transaction,
  Signer
} from "@solana/web3.js";
import { 
  getMint, 
} from "@solana/spl-token";
import { programService } from "./program";

// Extended signer interface that includes signTransaction
interface ExtendedSigner extends Signer {
  signTransaction(tx: Transaction): Promise<Transaction>;
}

// Oracle feed addresses for different currencies
const ORACLE_FEEDS = {
  USD: new PublicKey("GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR"),
  EUR: new PublicKey("HNStfhaLnqwF2ZtJUizaA9uHDAVB976r2AgTUx9LrdEo"),
  // Add other currency feeds as needed
};

export interface CreateStablecoinParams {
  name: string;
  symbol: string;
  icon: string;
  targetCurrency: string;
  payer: ExtendedSigner;
}

export interface StablecoinInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  targetCurrency: string;
  totalSupply: string;
  mintAddress: string;
  createdAt: Date;
}

export interface TransactionResult {
  signature: string;
  error?: string;
}

export const stablebondService = {
  async createStablecoin(
    connection: Connection,
    params: CreateStablecoinParams
  ): Promise<{ success: boolean; data?: StablecoinInfo; error?: string }> {
    try {
      // Create initialize instruction
      const instruction = await programService.createInitializeInstruction(
        connection,
        params.payer.publicKey,
        {
          name: params.name,
          symbol: params.symbol,
          icon: params.icon,
          targetCurrency: params.targetCurrency
        }
      );

      // Send the transaction
      const signature = await programService.sendTransaction(
        connection,
        instruction,
        [params.payer]
      );
      console.log("signature", signature);

      // Get the PDA for the mint
      const mintPDA = await programService.getConfigPDA(
        params.payer.publicKey,
        params.symbol
      );
      
      // Store metadata via API
      const response = await fetch("/api/stablecoins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: mintPDA.toBase58(),
          name: params.name,
          symbol: params.symbol,
          icon: params.icon,
          targetCurrency: params.targetCurrency,
          mintAddress: mintPDA.toBase58(),
          creatorAddress: params.payer.publicKey.toBase58(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to store stablecoin metadata");
      }

      const metadata = await response.json();
      
      return {
        success: true,
        data: {
          ...metadata,
          totalSupply: "0",
          createdAt: new Date(metadata.createdAt),
        },
      };
    } catch (error) {
      console.error("Failed to create stablecoin:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create stablecoin",
      };
    }
  },

  async getStablecoins(connection: Connection): Promise<StablecoinInfo[]> {
    try {
      const response = await fetch("/api/stablecoins");
      if (!response.ok) {
        throw new Error("Failed to fetch stablecoins");
      }

      const dbStablecoins = await response.json();
      const stablecoinsWithSupply: StablecoinInfo[] = [];

      for (const coin of dbStablecoins) {
        try {
          const mintInfo = await getMint(connection, new PublicKey(coin.mintAddress));
          stablecoinsWithSupply.push({
            ...coin,
            createdAt: new Date(coin.createdAt),
            totalSupply: (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toString(),
          });
        } catch (error) {
          console.error(`Failed to fetch mint info for ${coin.mintAddress}:`, error);
        }
      }

      return stablecoinsWithSupply;
    } catch (error) {
      console.error("Failed to fetch stablecoins:", error);
      return [];
    }
  },

  async mintTokens(
    connection: Connection,
    stablecoinId: string,
    amount: string,
    payer: ExtendedSigner
  ): Promise<{ success: boolean; data?: { newSupply: string; signature: string }; error?: string }> {
    try {
      const mintPubkey = new PublicKey(stablecoinId);
      
      // Get stablecoin info to know the target currency
      const stablecoinInfo = await this.getStablecoinInfo(connection, stablecoinId);
      if (!stablecoinInfo) {
        throw new Error("Stablecoin not found");
      }

      const oraclePubkey = ORACLE_FEEDS[stablecoinInfo.targetCurrency as keyof typeof ORACLE_FEEDS];
      if (!oraclePubkey) {
        throw new Error(`No oracle feed found for ${stablecoinInfo.targetCurrency}`);
      }

      // Create mint instruction
      const instruction = await programService.createMintInstruction(
        connection,
        payer.publicKey,
        mintPubkey,
        {
          amount: Number(amount),
          targetCurrency: stablecoinInfo.targetCurrency
        }
      );

      // Send the transaction
      const signature = await programService.sendTransaction(
        connection,
        instruction,
        [payer]
      );

      const mintInfo = await getMint(connection, mintPubkey);

      return {
        success: true,
        data: {
          newSupply: (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toString(),
          signature,
        },
      };
    } catch (error) {
      console.error("Failed to mint tokens:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mint tokens",
      };
    }
  },

  async redeemTokens(
    connection: Connection,
    stablecoinId: string,
    amount: string,
    payer: ExtendedSigner
  ): Promise<{ success: boolean; data?: { newSupply: string; signature: string }; error?: string }> {
    try {
      const mintPubkey = new PublicKey(stablecoinId);
      
      // Get stablecoin info to know the target currency
      const stablecoinInfo = await this.getStablecoinInfo(connection, stablecoinId);
      if (!stablecoinInfo) {
        throw new Error("Stablecoin not found");
      }

      const oraclePubkey = ORACLE_FEEDS[stablecoinInfo.targetCurrency as keyof typeof ORACLE_FEEDS];
      if (!oraclePubkey) {
        throw new Error(`No oracle feed found for ${stablecoinInfo.targetCurrency}`);
      }

      // Create redeem instruction
      const instruction = await programService.createRedeemInstruction(
        connection,
        payer.publicKey,
        mintPubkey,
        {
          amount: Number(amount),
          targetCurrency: stablecoinInfo.targetCurrency
        }
      );

      // Send the transaction
      const signature = await programService.sendTransaction(
        connection,
        instruction,
        [payer]
      );

      const mintInfo = await getMint(connection, mintPubkey);

      return {
        success: true,
        data: {
          newSupply: (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toString(),
          signature,
        },
      };
    } catch (error) {
      console.error("Failed to redeem tokens:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to redeem tokens",
      };
    }
  },

  async getStablecoinInfo(
    connection: Connection,
    stablecoinId: string
  ): Promise<StablecoinInfo | null> {
    try {
      const response = await fetch(`/api/stablecoins-data?id=${stablecoinId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch stablecoin");
      }

      const metadata = await response.json();
      const mintInfo = await getMint(connection, new PublicKey(stablecoinId));

      return {
        ...metadata,
        createdAt: new Date(metadata.createdAt),
        totalSupply: (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toString(),
      };
    } catch (error) {
      console.error("Failed to fetch stablecoin info:", error);
      return null;
    }
  },
}; 