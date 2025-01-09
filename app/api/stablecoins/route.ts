import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stablecoins } from "@/lib/db/schema/stablecoin";

export async function GET() {
  try {
    const coins = await db.select().from(stablecoins);
    return NextResponse.json(coins);
  } catch (error) {
    console.error("Failed to fetch stablecoins:", error);
    return NextResponse.json(
      { error: "Failed to fetch stablecoins" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const [coin] = await db.insert(stablecoins)
      .values({
        id: data.id,
        name: data.name,
        symbol: data.symbol,
        icon: data.icon,
        targetCurrency: data.targetCurrency,
        mintAddress: data.mintAddress,
        creatorAddress: data.creatorAddress,
      })
      .returning();

    return NextResponse.json(coin);
  } catch (error) {
    console.error("Failed to create stablecoin:", error);
    return NextResponse.json(
      { error: "Failed to create stablecoin" },
      { status: 500 }
    );
  }
} 