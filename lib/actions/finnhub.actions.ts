"use server";

import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY =
  process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

export async function fetchJSON<T>(
  url: string,
  revalidateSeconds?: number,
): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } =
    revalidateSeconds
      ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(
      `Fetch failed with status ${response.status}: ${response.statusText}`,
    );
  }
  return response.json() as Promise<T>;
}

export async function getNews(
  symbols?: string[],
): Promise<MarketNewsArticle[]> {
  try {
    const token = NEXT_PUBLIC_FINNHUB_API_KEY;
    const cleanedSymbols = symbols
      ? symbols.map((s) => s.trim().toUpperCase()).filter((s) => s.length > 0)
      : [];
    const maxArticles = 6;
    const { from, to } = getDateRange(5);

    if (cleanedSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};
      await Promise.all(
        cleanedSymbols.map(async (symbol) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url);
            perSymbolArticles[symbol] = articles || [].filter(validateArticle);
          } catch (error) {
            console.error(`Error fetching news for ${symbol}:`, error);
            perSymbolArticles[symbol] = [];
          }
        }),
      );
      const collected: MarketNewsArticle[] = [];

      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanedSymbols.length; i++) {
          const symbol = cleanedSymbols[i];
          const list = perSymbolArticles[symbol] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, symbol, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }
      if (collected.length > 0) {
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
    }
    //when symbol not provided fetch general news
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const generalNews = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of generalNews) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break;
    }
    return unique
      .slice(0, maxArticles)
      .map((a, idx) => formatArticle(a, false, undefined, idx));
  } catch (error) {
    console.error("Error in getNews:", error);
    throw new Error("Failed to fetch news");
  }
}
