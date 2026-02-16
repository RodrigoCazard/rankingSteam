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

// GET - Lista todas las compras pendientes
export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json([]);
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pending_purchases?select=*&order=detected_at.desc`,
    { headers: supabaseHeaders(), cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json([]);
  return NextResponse.json(await res.json());
}

// POST - Aprobar un pendiente: moverlo a purchases y eliminarlo
export async function POST(request: Request) {
  const body = await request.json();
  const { id, participant_id, game_name, game_appid, game_image, price } = body;

  if (!id || !participant_id || !game_name) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  // Insertar en purchases
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ participant_id, game_name, game_appid, game_image, price: price || 0 }),
  });

  if (!insertRes.ok) {
    return NextResponse.json({ error: "Error al aprobar compra" }, { status: 500 });
  }

  // Eliminar de pending_purchases
  await fetch(`${SUPABASE_URL}/rest/v1/pending_purchases?id=eq.${id}`, {
    method: "DELETE",
    headers: supabaseHeaders(),
  });

  return NextResponse.json({ success: true });
}

// DELETE - Rechazar/ignorar un pendiente
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/pending_purchases?id=eq.${id}`, {
    method: "DELETE",
    headers: supabaseHeaders(),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Error al rechazar" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
