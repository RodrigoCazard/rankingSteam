import { NextResponse } from "next/server";
import { convertToUSD } from "@/lib/currency";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STEAM_API_KEY = process.env.STEAM_API_KEY!;

interface OwnedGame {
  appid: number;
  name: string;
}

interface Participant {
  id: number;
  name: string;
  steam_id: string | null;
  country_code: string | null;
  known_appids: number[];
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function getOwnedGames(steamId: string): Promise<OwnedGame[]> {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=false&format=json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error("[Steam Sync] Error GetOwnedGames:", res.status);
    return [];
  }
  const data = await res.json();
  return data.response?.games || [];
}

async function getGamePrice(appid: number, countryCode: string): Promise<{ price: number; currency: string; image: string } | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${countryCode}&l=spanish`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[appid]?.success) return null;

    const gameData = data[appid].data;
    if (gameData.is_free) {
      return { price: 0, currency: "FREE", image: gameData.header_image || "" };
    }
    const priceInfo = gameData.price_overview;
    if (!priceInfo) return null;

    return {
      price: priceInfo.final / 100,
      currency: priceInfo.currency || "USD",
      image: gameData.header_image || "",
    };
  } catch {
    return null;
  }
}

async function updateKnownAppIds(participantId: number, appids: number[]) {
  await fetch(`${SUPABASE_URL}/rest/v1/participants?id=eq.${participantId}`, {
    method: "PATCH",
    headers: supabaseHeaders(),
    body: JSON.stringify({ known_appids: appids }),
  });
}

async function insertPendingPurchases(
  games: Array<{ participant_id: number; appid: number; name: string; image: string; price: number; currency: string }>
) {
  if (games.length === 0) return;
  const rows = games.map((g) => ({
    participant_id: g.participant_id,
    game_name: g.name,
    game_appid: g.appid,
    game_image: g.image,
    price: g.price,
    currency: g.currency,
  }));
  await fetch(`${SUPABASE_URL}/rest/v1/pending_purchases`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncSteamLibraries() {
  const participantsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/participants?select=id,name,steam_id,country_code,known_appids&steam_id=not.is.null&steam_id=neq.`,
    { headers: supabaseHeaders(), cache: "no-store" }
  );
  if (!participantsRes.ok) {
    const errorText = await participantsRes.text();
    console.error("[Steam Sync] Error obteniendo participantes:", participantsRes.status, errorText);
    return { error: "No se pudieron obtener los participantes", details: errorText };
  }
  const participants: Participant[] = await participantsRes.json();
  console.log(`[Steam Sync] Encontrados ${participants.length} participantes con Steam ID`);

  if (participants.length === 0) {
    return { success: true, results: [], message: "No hay participantes con Steam ID configurado" };
  }

  const results: Array<{ participant: string; new_games: number; skipped_free: number; first_sync: boolean }> = [];

  for (const p of participants) {
    if (!p.steam_id) continue;

    const ownedGames = await getOwnedGames(p.steam_id);
    if (ownedGames.length === 0) {
      console.log(`[Steam Sync] ${p.name}: 0 juegos encontrados (perfil privado?)`);
      results.push({ participant: p.name, new_games: 0, skipped_free: 0, first_sync: false });
      continue;
    }

    const knownSet = new Set(p.known_appids || []);
    const ownedAppIds = ownedGames.map((g) => g.appid);
    const isFirstSync = knownSet.size === 0;

    if (isFirstSync) {
      // Primera sync: registrar todos como conocidos (baseline), sin buscar precios
      await updateKnownAppIds(p.id, ownedAppIds);
      console.log(`[Steam Sync] ${p.name}: primera sync, registrados ${ownedAppIds.length} juegos como baseline`);
      results.push({ participant: p.name, new_games: 0, skipped_free: 0, first_sync: true });
      continue;
    }

    // Filtrar juegos nuevos (no están en known_appids)
    const newGames = ownedGames.filter((g) => !knownSet.has(g.appid));

    if (newGames.length === 0) {
      results.push({ participant: p.name, new_games: 0, skipped_free: 0, first_sync: false });
      continue;
    }

    console.log(`[Steam Sync] ${p.name}: ${newGames.length} juegos nuevos detectados`);

    const countryCode = p.country_code || "US";
    const pendingGames: Array<{ participant_id: number; appid: number; name: string; image: string; price: number; currency: string }> = [];
    let skippedFree = 0;

    for (const game of newGames) {
      const priceData = await getGamePrice(game.appid, countryCode);

      if (!priceData || priceData.currency === "FREE" || priceData.price === 0) {
        skippedFree++;
      } else {
        const priceUSD = await convertToUSD(priceData.price, priceData.currency);
        pendingGames.push({
          participant_id: p.id,
          appid: game.appid,
          name: game.name,
          image: priceData.image,
          price: priceUSD,
          currency: "USD",
        });
      }

      await sleep(250);
    }

    // Actualizar known_appids con todos los juegos actuales
    await updateKnownAppIds(p.id, ownedAppIds);
    await insertPendingPurchases(pendingGames);

    results.push({ participant: p.name, new_games: pendingGames.length, skipped_free: skippedFree, first_sync: false });
  }

  return { success: true, results };
}

export const maxDuration = 300;

export async function POST() {
  if (!STEAM_API_KEY) {
    return NextResponse.json({ error: "STEAM_API_KEY no configurada" }, { status: 500 });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }

  try {
    const result = await syncSteamLibraries();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Steam Sync] Error:", error);
    return NextResponse.json({ error: "Error durante la sincronizacion", details: String(error) }, { status: 500 });
  }
}
