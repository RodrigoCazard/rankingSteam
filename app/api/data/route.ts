import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// In-memory storage for v0 preview
const memoryPurchases: Array<{ id: number; participant_id: number; game_name: string; game_image: string | null; game_appid: number | null; price: number }> = [];
const memoryTrophies: Array<{ id: number; participant_id: number; month: number; year: number; position: number; total_spent: number }> = [];
let purchaseIdCounter = 1;
let trophyIdCounter = 1;

const FALLBACK_PARTICIPANTS = [
  { id: 1, name: "Shadowdark", avatar_url: "/avatars/shadowdark.png" },
  { id: 2, name: "Deadpool", avatar_url: "/avatars/deadpool.png" },
  { id: 3, name: "Dyx", avatar_url: "/avatars/dyx.png" },
  { id: 4, name: "Mostacho", avatar_url: "/avatars/mostacho.png" },
  { id: 5, name: "Rueda Desinflada", avatar_url: "/avatars/rueda.png" },
];

type Trophy = { id: number; participant_id: number; month: number; year: number; position: number; total_spent: number };

function buildParticipantsWithPurchases(
  participants: typeof FALLBACK_PARTICIPANTS, 
  purchases: typeof memoryPurchases,
  trophies: Trophy[]
) {
  const result = participants.map((p) => {
    const participantPurchases = purchases.filter((pur) => pur.participant_id === p.id);
    const total = participantPurchases.reduce((sum, pur) => sum + Number(pur.price), 0);
    const participantTrophies = trophies.filter((t) => t.participant_id === p.id);
    return { ...p, total, purchases: participantPurchases, trophies: participantTrophies };
  });
  return result.sort((a, b) => b.total - a.total);
}

async function trySupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[Supabase] Variables de entorno no configuradas. SUPABASE_URL:", !!SUPABASE_URL, "SUPABASE_KEY:", !!SUPABASE_KEY);
    return null;
  }

  try {
    const participantsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/participants?select=*&order=id.asc`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!participantsRes.ok) {
      console.error("[Supabase] Error fetching participants:", participantsRes.status, await participantsRes.text());
      return null;
    }
    const participants = await participantsRes.json();

    const purchasesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/purchases?select=*`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    const purchases = purchasesRes.ok ? await purchasesRes.json() : [];

    const trophiesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/trophies?select=*`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    const trophies = trophiesRes.ok ? await trophiesRes.json() : [];

    return { participants, purchases, trophies };
  } catch (error) {
    console.error("[Supabase] Error de conexion:", error);
    return null;
  }
}

export async function GET() {
  const supabaseData = await trySupabase();
  
  if (supabaseData) {
    return NextResponse.json(buildParticipantsWithPurchases(supabaseData.participants, supabaseData.purchases, supabaseData.trophies));
  }
  
  return NextResponse.json(buildParticipantsWithPurchases(FALLBACK_PARTICIPANTS, memoryPurchases, memoryTrophies));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { participant_id, game_name, game_image, game_appid, price } = body;

  // Try Supabase first
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ participant_id, game_name, game_image, game_appid, price }),
      });
      const text = await res.text();
      if (!text.includes("Invalid request") && res.ok) {
        return NextResponse.json({ success: true });
      }
    } catch {
      // Fall through to memory storage
    }
  }

  // Fallback to memory storage
  memoryPurchases.push({
    id: purchaseIdCounter++,
    participant_id,
    game_name,
    game_image,
    game_appid,
    price,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Try Supabase first
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/purchases?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      const text = await res.text();
      if (!text.includes("Invalid request") && res.ok) {
        return NextResponse.json({ success: true });
      }
    } catch {
      // Fall through to memory storage
    }
  }

  // Fallback to memory storage
  const index = memoryPurchases.findIndex((p) => p.id === Number(id));
  if (index !== -1) memoryPurchases.splice(index, 1);
  return NextResponse.json({ success: true });
}

// PATCH - Update purchase price
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, price } = body;
  if (!id || price === undefined) {
    return NextResponse.json({ error: "Missing id or price" }, { status: 400 });
  }

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/purchases?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ price }),
      });
      if (res.ok) {
        return NextResponse.json({ success: true });
      }
    } catch {
      // Fall through to memory storage
    }
  }

  const purchase = memoryPurchases.find((p) => p.id === Number(id));
  if (purchase) purchase.price = price;
  return NextResponse.json({ success: true });
}

// PUT - Close month: save trophies for top 3 and shame for last place (NO delete purchases)
export async function PUT(request: Request) {
  const body = await request.json();
  const { rankings, month, year } = body;

  // rankings = [{ participant_id, total, position }]
  // Top 3 get trophies (position 1, 2, 3), last place gets shame (position 5)
  
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      // Insert trophies for top 3
      for (const r of rankings.slice(0, 3)) {
        if (r.total > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/trophies`, {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              participant_id: r.participant_id,
              month,
              year,
              position: r.position,
              total_spent: r.total,
            }),
          });
        }
      }

      // Insert shame trophy for last place (position 5)
      const lastPlace = rankings[rankings.length - 1];
      if (lastPlace && rankings.length > 1) {
        await fetch(`${SUPABASE_URL}/rest/v1/trophies`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            participant_id: lastPlace.participant_id,
            month,
            year,
            position: 5, // Shame position
            total_spent: lastPlace.total,
          }),
        });
      }

      return NextResponse.json({ success: true });
    } catch {
      // Fall through to memory
    }
  }

  // Fallback to memory
  for (const r of rankings.slice(0, 3)) {
    if (r.total > 0) {
      memoryTrophies.push({
        id: trophyIdCounter++,
        participant_id: r.participant_id,
        month,
        year,
        position: r.position,
        total_spent: r.total,
      });
    }
  }
  
  // Shame for last place
  const lastPlace = rankings[rankings.length - 1];
  if (lastPlace && rankings.length > 1) {
    memoryTrophies.push({
      id: trophyIdCounter++,
      participant_id: lastPlace.participant_id,
      month,
      year,
      position: 5,
      total_spent: lastPlace.total,
    });
  }
  
  return NextResponse.json({ success: true });
}
