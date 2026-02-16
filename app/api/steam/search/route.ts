import { NextRequest, NextResponse } from "next/server";
import { convertToUSD } from "@/lib/currency";

interface SteamSearchResult {
  appid: number;
  name: string;
  price: string;
  priceNum: number;
  originalPrice: string;
  currency: string;
  image: string;
}

interface SteamStoreSearchItem {
  id: number;
  name: string;
  tiny_image: string;
}

async function getGamePrice(appid: number, cc: string): Promise<{
  priceNum: number;
  originalPrice: string;
  currency: string;
  image: string;
} | null> {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&l=spanish`,
      {
        headers: { "Accept": "application/json" },
        cache: "no-store"
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (!data[appid]?.success) return null;

    const gameData = data[appid].data;

    if (gameData.is_free) {
      return { priceNum: 0, originalPrice: "Gratis", currency: "FREE", image: gameData.header_image || "" };
    }

    const priceInfo = gameData.price_overview;
    if (!priceInfo) return { priceNum: 0, originalPrice: "No disponible", currency: "N/A", image: gameData.header_image || "" };

    return {
      priceNum: priceInfo.final / 100,
      originalPrice: priceInfo.final_formatted || `${(priceInfo.final / 100).toFixed(2)} ${priceInfo.currency}`,
      currency: priceInfo.currency || "USD",
      image: gameData.header_image || "",
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const cc = searchParams.get("cc") || "US";

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=spanish&cc=${cc}`;

    const searchResponse = await fetch(searchUrl, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (!searchResponse.ok) {
      return NextResponse.json({ error: "Steam search failed" }, { status: 500 });
    }

    const searchData = await searchResponse.json();
    const items: SteamStoreSearchItem[] = searchData.items || [];

    const results: SteamSearchResult[] = [];

    for (const item of items.slice(0, 5)) {
      const priceData = await getGamePrice(item.id, cc);

      const priceNum = priceData?.priceNum || 0;
      const currency = priceData?.currency || "N/A";
      const priceUSD = await convertToUSD(priceNum, currency);

      results.push({
        appid: item.id,
        name: item.name,
        price: currency === "FREE" ? "Gratis" : `$${priceUSD.toFixed(2)} USD`,
        priceNum: priceUSD,
        originalPrice: priceData?.originalPrice || "No disponible",
        currency,
        image: priceData?.image || item.tiny_image,
      });
    }

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Steam data" }, { status: 500 });
  }
}
