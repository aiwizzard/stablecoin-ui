import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SendTransactionError
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { Buffer } from 'buffer';
import { BN } from "bn.js";

// Oracle feed addresses for different currencies
const ORACLE_FEEDS = {
  USD: new PublicKey("GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR"),
  EUR: new PublicKey("HNStfhaLnqwF2ZtJUizaA9uHDAVB976r2AgTUx9LrdEo"),
  // Add other currency feeds as needed
};

// The program ID for the stablecoin program
export const PROGRAM_ID = new PublicKey("CP2kYxxR4sDWcJw4Rx6XBABdVpPMNeKXzDA4BjzdUySx");

// Instruction types from the program
export enum StablecoinInstruction {
  Initialize = 0,
  Mint = 1,
  Redeem = 2
}

export interface InitializeParams {
  name: string;
  symbol: string;
  icon: string;
  targetCurrency: string;
}

export interface MintParams {
  amount: number;
  targetCurrency: string;
}

export interface RedeemParams {
  amount: number;
  targetCurrency: string;
}

export const programService = {
  // Initialize a new stablecoin
  async createInitializeInstruction(
    connection: Connection,
    payer: PublicKey,
    params: InitializeParams
  ): Promise<TransactionInstruction> {
    // Create a PDA for the stablecoin config
    const [configPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("config"),
        payer.toBuffer(),
        Buffer.from(params.symbol)
      ],
      PROGRAM_ID
    );

    // Create a PDA for the mint authority
    const [mintAuthority] = await PublicKey.findProgramAddress(
      [
        Buffer.from("mint-authority"),
        configPDA.toBuffer()
      ],
      PROGRAM_ID
    );

    // Get the oracle account for the target currency
    const oracleAccount = ORACLE_FEEDS[params.targetCurrency as keyof typeof ORACLE_FEEDS];
    if (!oracleAccount) {
      throw new Error(`No oracle feed found for ${params.targetCurrency}`);
    }

    // Create the instruction data buffer
    const layout = {
      name: params.name,
      symbol: params.symbol,
      icon_uri: params.icon,
      target_currency: params.targetCurrency
    };

    // Serialize the instruction data
    const data = Buffer.alloc(1000); // Size for instruction data
    data.writeUInt8(StablecoinInstruction.Initialize, 0);
    let offset = 1;

    // Write strings with length prefix
    for (const [, value] of Object.entries(layout)) {
      const strBytes = Buffer.from(value);
      data.writeUInt8(strBytes.length, offset);
      offset += 1;
      strBytes.copy(data, offset);
      offset += strBytes.length;
    }

    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: true },
        { pubkey: mintAuthority, isSigner: false, isWritable: false },
        { pubkey: oracleAccount, isSigner: false, isWritable: false },
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
      ],
      data: data.slice(0, offset)
    });
  },

  // Mint new stablecoins
  async createMintInstruction(
    connection: Connection,
    payer: PublicKey,
    configPDA: PublicKey,
    params: MintParams
  ): Promise<TransactionInstruction> {
    // Get the mint authority PDA
    const [mintAuthority] = await PublicKey.findProgramAddress(
      [
        Buffer.from("mint-authority"),
        configPDA.toBuffer()
      ],
      PROGRAM_ID
    );

    // Get the token mint account
    const [tokenMint] = await PublicKey.findProgramAddress(
      [
        Buffer.from("token-mint"),
        configPDA.toBuffer()
      ],
      PROGRAM_ID
    );

    // Get the user's associated token account
    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      payer,
      false
    );

    // Get the oracle account
    const oracleAccount = ORACLE_FEEDS[params.targetCurrency as keyof typeof ORACLE_FEEDS];
    if (!oracleAccount) {
      throw new Error(`No oracle feed found for ${params.targetCurrency}`);
    }

    // Create the instruction data
    const data = Buffer.alloc(9); // 1 byte for instruction + 8 bytes for amount
    data.writeUInt8(StablecoinInstruction.Mint, 0);
    new BN(params.amount).toBuffer().copy(data, 1);

    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: true },
        { pubkey: tokenMint, isSigner: false, isWritable: true },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: oracleAccount, isSigner: false, isWritable: false },
        { pubkey: mintAuthority, isSigner: false, isWritable: false },
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      data
    });
  },

  // Redeem (burn) stablecoins
  async createRedeemInstruction(
    connection: Connection,
    payer: PublicKey,
    configPDA: PublicKey,
    params: RedeemParams
  ): Promise<TransactionInstruction> {
    // Get the token mint account
    const [tokenMint] = await PublicKey.findProgramAddress(
      [
        Buffer.from("token-mint"),
        configPDA.toBuffer()
      ],
      PROGRAM_ID
    );

    // Get the user's associated token account
    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      payer,
      false
    );

    // Get the oracle account
    const oracleAccount = ORACLE_FEEDS[params.targetCurrency as keyof typeof ORACLE_FEEDS];
    if (!oracleAccount) {
      throw new Error(`No oracle feed found for ${params.targetCurrency}`);
    }

    // Create the instruction data
    const data = Buffer.alloc(9); // 1 byte for instruction + 8 bytes for amount
    data.writeUInt8(StablecoinInstruction.Redeem, 0);
    new BN(params.amount).toBuffer().copy(data, 1);

    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: true },
        { pubkey: tokenMint, isSigner: false, isWritable: true },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: oracleAccount, isSigner: false, isWritable: false },
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      data
    });
  },

  // Send transaction helper remains the same
  async sendTransaction(
    connection: Connection,
    instruction: TransactionInstruction,
    signers: Array<{ publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> }>
  ): Promise<string> {
    try {
      const transaction = new Transaction().add(instruction);
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = signers[0].publicKey;

      const signedTx = await signers[0].signTransaction(transaction);
      
      try {
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        const confirmation = await connection.confirmTransaction(signature);
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
        }

        return signature;
      } catch (error) {
        if (error instanceof SendTransactionError) {
          const logs = error.logs?.join('\n');
          if (logs?.includes('Error: memory allocation failed, out of memory')) {
            throw new Error('Program error: Memory allocation failed. The transaction data might be too large.');
          } else if (logs) {
            throw new Error(`Transaction failed with logs:\n${logs}`);
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  },

  // Helper to get the PDA for a stablecoin config
  async getConfigPDA(
    payer: PublicKey,
    symbol: string
  ): Promise<PublicKey> {
    const [configPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("config"),
        payer.toBuffer(),
        Buffer.from(symbol)
      ],
      PROGRAM_ID
    );
    return configPDA;
  }
}; 