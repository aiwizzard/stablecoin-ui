import { PublicKey, Transaction } from "@solana/web3.js";

export interface PhantomWallet {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

export class PhantomWalletAdapter {
  private wallet: PhantomWallet;

  constructor(wallet: PhantomWallet) {
    this.wallet = wallet;
  }

  get publicKey(): PublicKey {
    if (!this.wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    return this.wallet.publicKey;
  }

  async signTransaction(tx: Transaction): Promise<Transaction> {
    if (!this.wallet.connected) {
      throw new Error("Wallet not connected");
    }
    return this.wallet.signTransaction(tx);
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    if (!this.wallet.connected) {
      throw new Error("Wallet not connected");
    }
    return this.wallet.signAllTransactions(txs);
  }

  // Implement the remaining Signer interface
  get secretKey(): Uint8Array {
    throw new Error("Secret key not available for Phantom wallet");
  }

  static fromPhantomWallet(wallet: PhantomWallet): PhantomWalletAdapter {
    return new PhantomWalletAdapter(wallet);
  }
}