"use server";

import { connectToDB } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { fetchJSON } from "./finnhub.actions";
import {
  formatChangePercent,
  formatMarketCapValue,
  formatPrice,
} from "../utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY =
  process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

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

export async function addToWatchlist({
  symbol,
  company,
}: {
  symbol: string;
  company: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    const mongooseConnection = await connectToDB();
    const db = mongooseConnection.connection.db;
    if (!db) {
      throw new Error("Mongoose connection failed");
    }
    const userId = session.user.id;
    const upperSymbol = symbol.toUpperCase().trim();

    const existing = await Watchlist.findOne({
      userId,
      symbol: upperSymbol,
    });

    if (existing) {
      // sudah ada -> hapus dari watchlist
      console.log("Stock removed from watchlist");
      return { success: false, message: "Stock already in watchlist" };
    } else {
      // belum ada -> tambahkan
      await Watchlist.create({
        userId,
        symbol: upperSymbol,
        company,
        addedAt: new Date(),
      });
      console.log("Stock added to watchlist");
      revalidatePath("/watchlist");
      revalidatePath(`/stocks/${symbol.toUpperCase().trim()}`);
      return { success: true, message: "Stock added to watchlist" };
    }
  } catch (error) {
    console.log("Error in addToWatchlist:", error);
    return { success: false, message: "Internal server error" };
  }
}

export const removeFromWatchlist = async (symbol: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase().trim(),
    });
    revalidatePath("/watchlist");
    revalidatePath(`/stocks/${symbol.toUpperCase().trim()}`);
    return { success: true, message: "Stock removed from watchlist" };
  } catch (error) {
    console.log("Error in removeFromWatchlist:", error);
    return { success: false, message: "Internal server error" };
  }
};

// Fetch stock details by symbol
export const getStocksDetails = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    const [quote, profile, financials] = await Promise.all([
      fetchJSON(
        // Price data - no caching for accuracy
        `${FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
      ),
      fetchJSON(
        // Company info - cache 1hr (rarely changes)
        `${FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
        3600,
      ),
      fetchJSON(
        // Financial metrics (P/E, etc.) - cache 30min
        `${FINNHUB_BASE_URL}/stock/metric?symbol=${cleanSymbol}&metric=all&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
        1800,
      ),
    ]);

    // Type cast the responses
    const quoteData = quote as QuoteData;
    const profileData = profile as ProfileData;
    const financialsData = financials as FinancialsData;

    // Check if we got valid quote and profile data
    if (!quoteData?.c || !profileData?.name)
      throw new Error("Invalid stock data received from API");

    const changePercent = quoteData.dp || 0;
    const peRatio = financialsData?.metric?.peNormalizedAnnual || null;

    return {
      symbol: cleanSymbol,
      company: profileData?.name,
      currentPrice: quoteData.c,
      changePercent,
      priceFormatted: formatPrice(quoteData.c),
      changeFormatted: formatChangePercent(changePercent),
      peRatio: peRatio?.toFixed(1) || "—",
      marketCapFormatted: formatMarketCapValue(
        profileData?.marketCapitalization || 0,
      ),
    };
  } catch (error) {
    console.error(`Error fetching details for ${cleanSymbol}:`, error);
    throw new Error("Failed to fetch stock details");
  }
});

// Get user's watchlist
export const getUserWatchlist = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    const watchlist = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(watchlist));
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};

// Get user's watchlist with stock data
export const getWatchlistWithData = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect("/sign-in");

    const watchlist = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    if (watchlist.length === 0) return [];

    const stocksWithData = await Promise.all(
      watchlist.map(async (item) => {
        const stockData = await getStocksDetails(item.symbol);

        if (!stockData) {
          console.warn(`Failed to fetch data for ${item.symbol}`);
          return item;
        }

        return {
          company: stockData.company,
          symbol: stockData.symbol,
          currentPrice: stockData.currentPrice,
          priceFormatted: stockData.priceFormatted,
          changeFormatted: stockData.changeFormatted,
          changePercent: stockData.changePercent,
          marketCap: stockData.marketCapFormatted,
          peRatio: stockData.peRatio,
        };
      }),
    );

    return JSON.parse(JSON.stringify(stocksWithData));
  } catch (error) {
    console.error("Error loading watchlist:", error);
    throw new Error("Failed to fetch watchlist");
  }
};
