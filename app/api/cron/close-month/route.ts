import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get previous month and year
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // Previous month (1-12)
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
  }

  try {
    // Get participants with their purchase totals
    const participantsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/participants?select=*`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    const participants = await participantsRes.json();

    const purchasesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/purchases?select=*`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    const purchases = await purchasesRes.json();

    // Calculate totals and create rankings
    const rankings = participants
      .map((p: { id: number }) => {
        const total = purchases
          .filter((pur: { participant_id: number }) => pur.participant_id === p.id)
          .reduce((sum: number, pur: { price: number }) => sum + Number(pur.price), 0);
        return { participant_id: p.id, total };
      })
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total)
      .map((r: { participant_id: number; total: number }, idx: number) => ({ ...r, position: idx + 1 }));

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
            month: prevMonth,
            year: prevYear,
            position: r.position,
            total_spent: r.total,
          }),
        });
      }
    }

    // Insert shame for last place
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
          month: prevMonth,
          year: prevYear,
          position: 5, // Shame
          total_spent: lastPlace.total,
        }),
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Closed month ${prevMonth}/${prevYear}`,
      rankings 
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Failed to close month" }, { status: 500 });
  }
}
