"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, Lightbulb, ChevronDown, ChevronUp, Check } from "lucide-react";
import type { Participant, SteamGame } from "./types";

interface SuggestGamePanelProps {
  participants: Participant[];
  open: boolean;
  onToggle: () => void;
  selectedParticipant: number | null;
  onSelectParticipant: (id: number) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchResults: SteamGame[];
  searching: boolean;
  onSearch: () => void;
  onSuggest: (game: SteamGame) => void;
}

export function SuggestGamePanel({
  participants,
  open,
  onToggle,
  selectedParticipant,
  onSelectParticipant,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searching,
  onSearch,
  onSuggest,
}: SuggestGamePanelProps) {
  const [sentAppIds, setSentAppIds] = useState<Set<number>>(new Set());

  function handleSuggest(game: SteamGame) {
    onSuggest(game);
    setSentAppIds((prev) => new Set(prev).add(game.appid));
  }

  return (
    <div className="mb-3 shrink-0">
      <Button
        onClick={onToggle}
        variant="outline"
        className="w-full bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30 hover:text-purple-200"
      >
        <Lightbulb className="h-4 w-4 mr-2" />
        Sugerir un juego
        {open ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
      </Button>

      {open && (
        <div className="mt-2 p-3 rounded-xl bg-purple-600/20 border border-purple-500/30">
          <p className="text-purple-300/70 text-xs mb-3">
            Sugiere un juego para un participante. El admin lo revisara antes de agregarlo.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {participants.map((p) => (
              <Button
                key={p.id}
                variant={selectedParticipant === p.id ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectParticipant(p.id)}
                className={
                  selectedParticipant === p.id
                    ? "bg-purple-600"
                    : "bg-transparent border-white/20 text-white hover:bg-white/10"
                }
              >
                {p.name}
              </Button>
            ))}
          </div>

          {selectedParticipant && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar juego en Steam..."
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
                <Button onClick={onSearch} disabled={searching} className="bg-purple-600 hover:bg-purple-700">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((game) => {
                    const alreadySent = sentAppIds.has(game.appid);
                    return (
                      <div key={game.appid} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-24 sm:w-32 h-[45px] sm:h-[60px] object-cover rounded-md shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{game.name}</p>
                          <p className="text-green-400 text-sm font-bold">
                            {game.price}
                            {game.currency !== "FREE" &&
                              game.currency !== "USD" &&
                              game.currency !== "N/A" && (
                                <span className="text-white/30 text-xs font-normal ml-1">
                                  ({game.originalPrice})
                                </span>
                              )}
                          </p>
                        </div>
                        {alreadySent ? (
                          <div className="flex items-center gap-1 text-green-400 text-xs font-medium px-2">
                            <Check className="h-4 w-4" />
                            Enviado
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSuggest(game)}
                            className="bg-purple-600 hover:bg-purple-700 h-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
