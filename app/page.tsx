"use client";

import { Loader2 } from "lucide-react";
import { useRanking } from "@/components/ranking/use-ranking";
import { Header } from "@/components/ranking/Header";
import { AdminPanel } from "@/components/ranking/AdminPanel";
import { SuggestGamePanel } from "@/components/ranking/SuggestGamePanel";
import { ParticipantCard } from "@/components/ranking/ParticipantCard";
import { PurchaseDialog } from "@/components/ranking/PurchaseDialog";
import { PendingDialog } from "@/components/ranking/PendingDialog";

export default function SteamRankingPage() {
  const r = useRanking();

  if (r.loading) {
    return (
      <div className="min-h-svh bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main
      className="min-h-svh bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/bg-gaming.jpg')" }}
    >
      <div className="min-h-svh bg-black/70 backdrop-blur-sm p-4 md:p-6">
        <div className="max-w-4xl mx-auto w-full">
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

          {!r.isAdmin && (
            <SuggestGamePanel
              participants={r.participants}
              open={r.suggestOpen}
              onToggle={() => r.setSuggestOpen(!r.suggestOpen)}
              selectedParticipant={r.suggestSelectedParticipant}
              onSelectParticipant={r.setSuggestSelectedParticipant}
              searchQuery={r.suggestSearchQuery}
              onSearchQueryChange={r.setSuggestSearchQuery}
              searchResults={r.suggestSearchResults}
              searching={r.suggestSearching}
              onSearch={r.suggestSearchGames}
              onSuggest={r.handleSuggestGame}
            />
          )}

          <div className="flex flex-col gap-3">
            {r.participants.map((participant, index) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                index={index}
                totalParticipants={r.participants.length}
                isAdmin={r.isAdmin}
                pendingForParticipant={r.pendingPurchases.filter(
                  (pp) => pp.participant_id === participant.id
                )}
                onViewParticipant={r.setViewingParticipant}
                onApprovePending={r.handleApprovePending}
                onRejectPending={r.handleRejectPending}
              />
            ))}
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
