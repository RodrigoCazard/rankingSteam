"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2 } from "lucide-react";
import type { Participant, SteamGame } from "./types";
import { PriceEditor } from "./PriceEditor";

interface AdminPanelProps {
  participants: Participant[];
  selectedParticipant: number | null;
  onSelectParticipant: (id: number) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchResults: SteamGame[];
  searching: boolean;
  onSearch: () => void;
  onAddGame: (game: SteamGame, customPrice?: number) => void;
  isAdmin: boolean;
}

export function AdminPanel({
  participants,
  selectedParticipant,
  onSelectParticipant,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searching,
  onSearch,
  onAddGame,
  isAdmin,
}: AdminPanelProps) {
  const [editingAppId, setEditingAppId] = useState<number | null>(null);

  return (
    <div className={`mb-3 p-3 rounded-xl shrink-0 ${isAdmin ? "bg-blue-600/20 border border-blue-500/30" : "bg-white/5 border border-white/10"}`}>
      {!isAdmin && (
        <p className="text-white/50 text-xs mb-2">
          El juego quedara pendiente hasta que el admin lo apruebe.
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {participants.map((p) => (
          <Button
            key={p.id}
            variant={selectedParticipant === p.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectParticipant(p.id)}
            className={
              selectedParticipant === p.id
                ? "bg-blue-600"
                : "bg-transparent border-white/20 text-white hover:bg-white/10"
            }
          >
            {p.name}
            {p.country_code && (
              <span className="ml-1 text-[10px] opacity-60">{p.country_code}</span>
            )}
          </Button>
        ))}
      </div>

      {selectedParticipant && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar juego..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            <Button onClick={onSearch} disabled={searching} className="bg-blue-600 hover:bg-blue-700">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((game) => (
                <div key={game.appid} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-24 sm:w-32 h-[45px] sm:h-[60px] object-cover rounded-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{game.name}</p>
                    {isAdmin && editingAppId === game.appid ? (
                      <PriceEditor
                        initialValue={game.priceNum}
                        onSave={(price) => {
                          onAddGame(game, price);
                          setEditingAppId(null);
                        }}
                        onCancel={() => setEditingAppId(null)}
                      />
                    ) : (
                      <p
                        className={`text-green-400 text-sm font-bold ${isAdmin ? "cursor-pointer hover:text-green-300" : ""}`}
                        onClick={isAdmin ? (e) => {
                          e.stopPropagation();
                          setEditingAppId(game.appid);
                        } : undefined}
                        title={isAdmin ? "Click para editar precio" : undefined}
                      >
                        {game.price}
                        {game.currency !== "FREE" &&
                          game.currency !== "USD" &&
                          game.currency !== "N/A" && (
                            <span className="text-white/30 text-xs font-normal ml-1">
                              ({game.originalPrice})
                            </span>
                          )}
                      </p>
                    )}
                  </div>
                  {editingAppId !== game.appid && (
                    <Button
                      size="sm"
                      onClick={() => onAddGame(game)}
                      className="bg-green-600 hover:bg-green-700 h-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
