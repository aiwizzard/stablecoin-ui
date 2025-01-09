import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stablecoins } from "@/lib/db/schema/stablecoin";
import { eq } from "drizzle-orm";

export async function GET(request: Request)  {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    const [coin] = await db.select()
      .from(stablecoins)
      .where(eq(stablecoins.id, id))
      .limit(1);

    if (!coin) {
      return NextResponse.json(
        { error: "Stablecoin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(coin);
  } catch (error) {
    console.error("Failed to fetch stablecoin:", error);
    return NextResponse.json(
      { error: "Failed to fetch stablecoin" },
      { status: 500 }
    );
  }
} 