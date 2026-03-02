export async function sendPurchaseNotification(
  participantName: string,
  gameName: string,
  price: number,
  gameImage?: string
) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const embed = {
    title: "🎮 Nueva compra aprobada",
    description: `**${participantName}** acaba de gastar en Steam`,
    color: 0x1db954,
    fields: [
      { name: "🕹️ Juego", value: gameName, inline: true },
      { name: "💸 Precio", value: `$${price.toFixed(2)} USD`, inline: true },
    ],
    thumbnail: gameImage ? { url: gameImage } : undefined,
    footer: { text: "Ranking Steam • Familia Mentirosos y Ratas Unidos" },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {
    // No bloquear si Discord falla
  }
}
