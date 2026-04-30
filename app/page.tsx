"use client";

import { Loader2 } from "lucide-react";
import { useRanking } from "@/components/ranking/use-ranking";
import { Header } from "@/components/ranking/Header";
import { AdminPanel } from "@/components/ranking/AdminPanel";
import { ParticipantCard } from "@/components/ranking/ParticipantCard";
import { PurchaseDialog } from "@/components/ranking/PurchaseDialog";
import { PendingDialog } from "@/components/ranking/PendingDialog";
import { getTrophyIcon, MONTH_NAMES } from "@/components/ranking/constants";

function ZoneDivider({ label, color = "yellow" }: { label: string; color?: "yellow" | "red" | "gray" }) {
  const styles = {
    yellow: { via: "via-yellow-500/50", text: "text-yellow-400/80" },
    red: { via: "via-red-500/50", text: "text-red-400/80" },
    gray: { via: "via-white/20", text: "text-white/40" },
  };
  const { via, text } = styles[color];
  return (
    <div className="flex items-center gap-3 my-2">
      <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${via} to-transparent`} />
      <span className={`${text} text-[10px] font-black tracking-[0.2em] uppercase px-2`}>{label}</span>
      <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${via} to-transparent`} />
    </div>
  );
}

export default function SteamRankingPage() {
  const r = useRanking();

  if (r.loading) {
    return (
      <div className="min-h-svh bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  const totalClan = r.participants.reduce((sum, p) => sum + p.total, 0);
  const totalGames = r.participants.reduce((sum, p) => sum + p.purchases.length, 0);
  const maxTotal = r.participants[0]?.total || 1;

  const consejo = r.participants.slice(0, Math.min(3, r.participants.length));
  const mediocres = r.participants.length > 2 ? r.participants.slice(3, r.participants.length - 1) : [];
  const ultimo = r.participants.length > 1 ? r.participants[r.participants.length - 1] : null;

  function renderCard(participant: typeof r.participants[0], index: number) {
    return (
      <div key={participant.id} className="flex gap-3 items-stretch">
        <div className="flex-1 min-w-0">
          <ParticipantCard
            participant={participant}
            index={index}
            totalParticipants={r.participants.length}
            isAdmin={r.isAdmin}
            maxTotal={maxTotal}
            pendingForParticipant={r.pendingPurchases.filter(
              (pp) => pp.participant_id === participant.id
            )}
            onViewParticipant={r.setViewingParticipant}
            onApprovePending={r.handleApprovePending}
            onRejectPending={r.handleRejectPending}
          />
        </div>
        <div className="hidden lg:flex w-[200px] shrink-0 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex-wrap content-start justify-start gap-1.5 p-2">
          {participant.trophies?.length > 0 ? (
            participant.trophies.map((trophy) => (
              <span
                key={trophy.id}
                title={`${MONTH_NAMES[trophy.month - 1]} ${trophy.year}`}
              >
                {getTrophyIcon(trophy.position, "lg")}
              </span>
            ))
          ) : (
            <span className="text-white/15 text-xs">—</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-svh relative overflow-hidden">
      {/* Fondo con blur */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: "url('https://i.imgur.com/cYiVA8q.png')", filter: "blur(4px)" }}
      />
      <div className="absolute inset-0 bg-black/65" />
      <div className="relative px-3 py-2 sm:px-6 md:px-20 lg:px-52 lg:py-3">

        <Header
          isAdmin={r.isAdmin}
          syncing={r.syncing}
          pendingCount={r.pendingPurchases.length}
          loginOpen={r.loginOpen}
          setLoginOpen={r.setLoginOpen}
          password={r.password}
          setPassword={r.setPassword}
          loginError={r.loginError}
          handleLogin={r.handleLogin}
          onSync={r.handleSyncSteam}
          onOpenPending={() => r.setPendingOpen(true)}
          onCloseMonth={r.handleCloseMonth}
          onLogout={() => r.setIsAdmin(false)}
        />

        {r.isAdmin && (
          <AdminPanel
            participants={r.participants}
            selectedParticipant={r.selectedParticipant}
            onSelectParticipant={r.setSelectedParticipant}
            searchQuery={r.searchQuery}
            onSearchQueryChange={r.setSearchQuery}
            searchResults={r.searchResults}
            searching={r.searching}
            onSearch={r.searchGames}
            onAddGame={r.handleAddGame}
          />
        )}

        {/* Layout 2 columnas */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[200px_1fr] lg:gap-5 lg:items-start">

          {/* Columna izquierda: Stats */}
          <div className="flex flex-row gap-3 lg:flex-col lg:sticky lg:top-4 lg:mt-14">
            {[
              {
                icon: "💰",
                label: "Tesorería del Clan",
                value: `$${totalClan.toFixed(2)}`,
                from: "from-yellow-500/20",
                border: "border-yellow-500/30",
                textColor: "text-yellow-300",
              },
              {
                icon: "🎮",
                label: "Juegos Comprados",
                value: String(totalGames),
                from: "from-blue-500/20",
                border: "border-blue-500/30",
                textColor: "text-blue-300",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border ${stat.border} bg-gradient-to-br ${stat.from} to-transparent backdrop-blur-md p-3 lg:p-4 flex flex-col gap-1 lg:gap-2 flex-1`}
              >
                <span className="text-2xl lg:text-3xl">{stat.icon}</span>
                <p className={`text-base lg:text-xl font-black ${stat.textColor} leading-tight`}>{stat.value}</p>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wide leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Columna central: Ranking */}
          <div>
            {consejo.length > 0 && (
              <>
                <div className="lg:pr-[220px]">
                  <ZoneDivider label="⚔️  El Consejo  ⚔️" color="yellow" />
                </div>
                <div className="flex flex-col gap-3">
                  {consejo.map((p, i) => renderCard(p, i))}
                </div>
              </>
            )}

            {mediocres.length > 0 && (
              <>
                <div className="lg:pr-[220px] my-4">
                  <div className="h-px bg-white/10" />
                </div>
                <div className="flex flex-col gap-3">
                  {mediocres.map((p, i) => renderCard(p, i + 3))}
                </div>
              </>
            )}

            {ultimo && (
              <>
                <div className="lg:pr-[220px]">
                  <ZoneDivider label="💀  El Sótano de la Vergüenza  💀" color="red" />
                </div>
                <div className="flex flex-col gap-3">
                  {renderCard(ultimo, r.participants.length - 1)}
                </div>
              </>
            )}
          </div>


        </div>
      </div>

      <PurchaseDialog
        participant={r.viewingParticipant}
        isAdmin={r.isAdmin}
        onClose={() => r.setViewingParticipant(null)}
        onRemovePurchase={r.handleRemovePurchase}
        onUpdatePrice={r.handleUpdatePrice}
        onLocalUpdate={r.setViewingParticipant}
      />

      <PendingDialog
        open={r.pendingOpen}
        onOpenChange={r.setPendingOpen}
        pendingPurchases={r.pendingPurchases}
        participants={r.participants}
        onApprove={r.handleApprovePending}
        onReject={r.handleRejectPending}
      />
    </main>
  );
}
