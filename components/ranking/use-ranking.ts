"use client";

import { useState, useEffect, useCallback } from "react";
import type { Participant, SteamGame, PendingPurchase } from "./types";
import { MONTH_NAMES } from "./constants";

export function useRanking() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SteamGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data");
      const data = await res.json();
      setParticipants(Array.isArray(data) ? data : []);
    } catch {
      setParticipants([]);
    }
    setLoading(false);
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/steam/pending");
      const data = await res.json();
      setPendingPurchases(Array.isArray(data) ? data : []);
    } catch {
      setPendingPurchases([]);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  async function handleLogin() {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        setLoginError("");
        setPassword("");
        setLoginOpen(false);
      } else {
        setLoginError("Password incorrecta");
      }
    } catch {
      setLoginError("Error de conexion");
    }
  }

  async function searchGames() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const participant = participants.find((p) => p.id === selectedParticipant);
      const cc = participant?.country_code || "US";
      const response = await fetch(
        `/api/steam/search?q=${encodeURIComponent(searchQuery)}&cc=${cc}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }

  async function handleAddGame(game: SteamGame, customPrice?: number) {
    if (!selectedParticipant) return;
    const price = customPrice !== undefined ? customPrice : game.priceNum;

    if (isAdmin) {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: selectedParticipant,
          game_name: game.name,
          game_image: game.image,
          game_appid: game.appid,
          price,
        }),
      });
      fetchParticipants();
    } else {
      await fetch("/api/steam/pending", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: selectedParticipant,
          game_name: game.name,
          game_image: game.image,
          game_appid: game.appid,
          price,
          currency: game.currency || "USD",
        }),
      });
      await fetchPending();
    }
    setSearchQuery("");
    setSearchResults([]);
  }

  async function handleRemovePurchase(purchaseId: number) {
    await fetch(`/api/data?id=${purchaseId}`, { method: "DELETE" });
    fetchParticipants();
  }

  async function handleCloseMonth() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const rankings = participants.map((p, idx) => ({
      participant_id: p.id,
      total: p.total,
      position: idx + 1,
    }));

    if (
      confirm(
        `Cerrar el mes de ${MONTH_NAMES[month - 1]} ${year}? Se guardaran los trofeos para los primeros 3 y la marca de verguenza para el ultimo.`
      )
    ) {
      await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankings, month, year }),
      });
      fetchParticipants();
    }
  }

  async function handleSyncSteam() {
    setSyncing(true);
    try {
      await fetch("/api/steam/sync", { method: "POST" });
      await fetchPending();
    } catch {
      // silently fail
    }
    setSyncing(false);
  }

  async function handleApprovePending(pending: PendingPurchase, customPrice?: number) {
    const price = customPrice !== undefined ? customPrice : pending.price;
    await fetch("/api/steam/pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pending.id,
        participant_id: pending.participant_id,
        game_name: pending.game_name,
        game_appid: pending.game_appid,
        game_image: pending.game_image,
        price,
      }),
    });
    setPendingPurchases((prev) => prev.filter((p) => p.id !== pending.id));
    fetchParticipants();
  }

  async function handleRejectPending(id: number) {
    await fetch(`/api/steam/pending?id=${id}`, { method: "DELETE" });
    setPendingPurchases((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleUpdatePrice(purchaseId: number, newPrice: number) {
    await fetch("/api/data", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: purchaseId, price: newPrice }),
    });
    if (viewingParticipant) {
      const updatedPurchases = viewingParticipant.purchases.map((p) =>
        p.id === purchaseId ? { ...p, price: newPrice } : p
      );
      const newTotal = updatedPurchases.reduce((sum, p) => sum + Number(p.price), 0);
      setViewingParticipant({
        ...viewingParticipant,
        purchases: updatedPurchases,
        total: newTotal,
      });
    }
    fetchParticipants();
  }

  return {
    // State
    isAdmin,
    loading,
    participants,
    pendingPurchases,
    syncing,
    pendingOpen,
    searchQuery,
    searchResults,
    searching,
    selectedParticipant,
    viewingParticipant,
    password,
    loginError,
    loginOpen,
    // Setters
    setIsAdmin,
    setPendingOpen,
    setSearchQuery,
    setSelectedParticipant,
    setViewingParticipant,
    setPassword,
    setLoginError,
    setLoginOpen,
    // Actions
    handleLogin,
    searchGames,
    handleAddGame,
    handleRemovePurchase,
    handleCloseMonth,
    handleSyncSteam,
    handleApprovePending,
    handleRejectPending,
    handleUpdatePrice,
  };
}
