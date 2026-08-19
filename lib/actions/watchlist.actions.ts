"use server";

import { connectToDB } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(
  email: string,
): Promise<string[]> {
  try {
    const mongooseConnection = await connectToDB();
    const db = mongooseConnection.connection.db;
    if (!db) {
      throw new Error("Mongoose connection failed");
    }

    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
    if (!user) return [];

    const userId = user.id || String(user._id || "");
    if (!userId) return [];

    const watchlistItems = await Watchlist.find(
      { userId },
      { symbol: 1 },
    ).lean();

    return watchlistItems.map((item) => String(item.symbol));
  } catch (error) {
    console.error("Error in getWatchlistSymbolsByEmail:", error);
    return [];
  }
}

