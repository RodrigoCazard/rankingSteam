import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function POST() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }

  try {
    // Traer participantes con steam_id y su known_appids actualizado
    const participantsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/participants?select=id,name,known_appids&steam_id=not.is.null&steam_id=neq.`,
      { headers: supabaseHeaders(), cache: "no-store" }
    );
    if (!participantsRes.ok) {
      return NextResponse.json({ error: "Error obteniendo participantes" }, { status: 500 });
    }
    const participants: Array<{ id: number; name: string; known_appids: number[] }> =
      await participantsRes.json();

    // Traer todas las compras confirmadas con game_appid
    const purchasesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/purchases?select=id,participant_id,game_name,game_appid&game_appid=not.is.null`,
      { headers: supabaseHeaders(), cache: "no-store" }
    );
    if (!purchasesRes.ok) {
      return NextResponse.json({ error: "Error obteniendo compras" }, { status: 500 });
    }
    const purchases: Array<{
      id: number;
      participant_id: number;
      game_name: string;
      game_appid: number;
    }> = await purchasesRes.json();

    // Traer pending purchases con game_appid
    const pendingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pending_purchases?select=id,participant_id,game_name,game_appid&game_appid=not.is.null`,
      { headers: supabaseHeaders(), cache: "no-store" }
    );
    const pendingPurchases: Array<{
      id: number;
      participant_id: number;
      game_name: string;
      game_appid: number;
    }> = pendingRes.ok ? await pendingRes.json() : [];

    const removed: Array<{ participant: string; game: string }> = [];
    const removedPending: Array<{ participant: string; game: string }> = [];

    for (const p of participants) {
      const knownSet = new Set(p.known_appids || []);
      // Sin baseline aun: no podemos saber que fue devuelto
      if (knownSet.size === 0) continue;

      // Compras confirmadas cuyo appid ya no esta en la libreria
      const returnedPurchases = purchases.filter(
        (pur) => pur.participant_id === p.id && !knownSet.has(pur.game_appid)
      );

      for (const pur of returnedPurchases) {
        const delRes = await fetch(`${SUPABASE_URL}/rest/v1/purchases?id=eq.${pur.id}`, {
          method: "DELETE",
          headers: supabaseHeaders(),
        });
        if (delRes.ok) {
          removed.push({ participant: p.name, game: pur.game_name });
          console.log(`[Returns] Eliminado: "${pur.game_name}" de ${p.name} (devuelto en Steam)`);
        }
      }

      // Pendientes cuyo appid ya no esta en la libreria
      const returnedPending = pendingPurchases.filter(
        (pur) => pur.participant_id === p.id && !knownSet.has(pur.game_appid)
      );

      for (const pur of returnedPending) {
        const delRes = await fetch(
          `${SUPABASE_URL}/rest/v1/pending_purchases?id=eq.${pur.id}`,
          { method: "DELETE", headers: supabaseHeaders() }
        );
        if (delRes.ok) {
          removedPending.push({ participant: p.name, game: pur.game_name });
          console.log(
            `[Returns] Pendiente eliminado: "${pur.game_name}" de ${p.name} (devuelto en Steam)`
          );
        }
      }
    }

    return NextResponse.json({ success: true, removed, removed_pending: removedPending });
  } catch (error) {
    console.error("[Returns] Error:", error);
    return NextResponse.json(
      { error: "Error en la verificacion de devoluciones", details: String(error) },
      { status: 500 }
    );
  }
}
