"use client";

import { useState } from "react";
import { Eye, Check, X } from "lucide-react";
import type { Participant, PendingPurchase } from "./types";
import { getMedal, getTrophyIcon, getRankTitle, MONTH_NAMES } from "./constants";
import { PriceEditor } from "./PriceEditor";

interface ParticipantCardProps {
  participant: Participant;
  index: number;
  totalParticipants: number;
  isAdmin: boolean;
  pendingForParticipant: PendingPurchase[];
  onViewParticipant: (p: Participant) => void;
  onApprovePending: (pending: PendingPurchase, customPrice?: number) => void;
  onRejectPending: (id: number) => void;
}

const CARD_STYLES: Record<number, string> = {
  0: "bg-gradient-to-r from-yellow-500/30 via-yellow-400/10 to-amber-500/20 border-2 border-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.3)]",
  1: "bg-gradient-to-r from-slate-300/20 via-gray-400/10 to-slate-400/15 border-2 border-gray-300/50 shadow-[0_0_20px_rgba(209,213,219,0.2)]",
  2: "bg-gradient-to-r from-amber-700/25 via-orange-700/10 to-amber-800/20 border border-amber-600/40 shadow-[0_0_15px_rgba(217,119,6,0.2)]",
  3: "bg-gradient-to-r from-red-900/20 to-red-950/10 border border-red-800/30",
};

const LAST_PLACE_STYLE =
  "bg-gradient-to-r from-purple-950/30 via-red-950/20 to-purple-900/20 border-2 border-dashed border-red-500/50";

const BADGE_STYLES: Record<number, string> = {
  0: "bg-yellow-500/30 text-yellow-300",
  1: "bg-blue-500/30 text-blue-300",
  2: "bg-orange-500/30 text-orange-300",
  3: "bg-red-500/30 text-red-300",
};

const AVATAR_SIZES: Record<number, string> = {
  0: "w-12 h-12 sm:w-14 sm:h-14",
  1: "w-11 h-11 sm:w-12 sm:h-12",
  2: "w-10 h-10 sm:w-11 sm:h-11",
};

export function ParticipantCard({
  participant,
  index,
  totalParticipants,
  isAdmin,
  pendingForParticipant,
  onViewParticipant,
  onApprovePending,
  onRejectPending,
}: ParticipantCardProps) {
  const [editingPendingId, setEditingPendingId] = useState<number | null>(null);
  const isLastPlace = index === totalParticipants - 1 && totalParticipants > 1;

  const cardClass = isLastPlace
    ? LAST_PLACE_STYLE
    : CARD_STYLES[index] || "bg-white/5 border border-white/10";

  const badgeClass = BADGE_STYLES[index] || "bg-purple-500/30 text-purple-300";
  const avatarSize = AVATAR_SIZES[index] || "w-10 h-10";
  const nameSize = index === 0 ? "text-base sm:text-lg" : index === 1 ? "text-sm sm:text-base" : "text-sm";
  const priceSize = index === 0 ? "text-xl sm:text-2xl" : index === 1 ? "text-lg sm:text-xl" : index === 2 ? "text-base sm:text-lg" : "text-base";

  const cardStyle = isLastPlace
    ? { animation: "wobble 1.5s ease-in-out infinite" }
    : index === 0
    ? { animation: "glow 2s ease-in-out infinite alternate" }
    : undefined;

  const sorted = [...participant.purchases].sort((a, b) => Number(b.price) - Number(a.price));

  return (
    <div
     
      className={`rounded-xl p-3 sm:p-4 backdrop-blur-md transition-all relative overflow-hidden  ${cardClass}`}
      style={cardStyle}
    >
      {/* Decoraciones por posición */}
      {index === 0 && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
        </>
      )}
      {index === 1 && (
        <>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-gray-400 via-slate-300 to-gray-400" />
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gray-300/10 rounded-full blur-xl" />
        </>
      )}
      {index === 2 && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700" />
      )}
      {isLastPlace && (
        <>
          <div className="absolute top-2 right-2 text-red-400/60 text-xs font-bold animate-pulse">
            VERGUENZA
          </div>
          <div className="absolute -bottom-5 -right-5 w-20 h-20 bg-red-600/10 rounded-full blur-xl" />
        </>
      )}

      {/* Contenido principal */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{getMedal(index)}</div>

        {participant.avatar_url ? (
          <img
            src={participant.avatar_url}
            alt={participant.name}
            className={`rounded-full object-cover border-2 border-white/20 ${avatarSize}`}
          />
        ) : (
          <div
            className={`rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 ${avatarSize}`}
          >
            <span className="font-bold text-white/60 text-lg">
              {participant.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}


        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-white ${nameSize}`}>{participant.name}</h3>
            <span
              className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold ${badgeClass}`}
            >
              {getRankTitle(index)}
            </span>
            {participant.trophies?.length > 0 && (
              <div
                className="flex items-center gap-1"
                title={`${participant.trophies.length} trofeos ganados`}
              >
                {participant.trophies.map((trophy) => (
                  <span
                    key={trophy.id}
                    title={`${MONTH_NAMES[trophy.month - 1]} ${trophy.year}`}
                  >
                    {getTrophyIcon(trophy.position)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className={`font-bold text-green-400 ${priceSize}`}>
              ${participant.total.toFixed(2)}
            </p>
            {/* {participant.purchases.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewParticipant(participant);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white text-[10px] font-medium transition-colors"
              >
                <Eye className="h-3 w-3" />
                {participant.purchases.length} juegos
              </button>
            )} */}
          </div>
        </div>
        {sorted.length > 8 && (
            <button
              type="button"
              onClick={() => onViewParticipant(participant)}
              className="relative z-10 cursor-pointer h-12  px-3 shrink-0  rounded-md border border-white/10 bg-white/5 hover:bg-white/15 text-white/60 hover:text-white text-xs font-medium transition-colors flex items-center "
            >
              +{sorted.length - 8} juegos mas
            </button>
          )}
      </div>


      {/* Thumbnails de juegos comprados */}
      {sorted.length > 0 && (
        <div
          className="mt-2 grid gap-2 grid-cols-1 grid-cols-4 sm:grid-cols-6 md:grid-cols-8  xl:grid-cols-8"


          onClick={(e) => e.stopPropagation()}
        >
          {sorted.slice(0, 8).map((purchase) => (
            <img
              key={purchase.id}
              src={purchase.game_image || "/placeholder.svg"}
              alt={purchase.game_name}
              className="h-13  transition-transform duration-200 hover:scale-105  object-cover rounded-md border border-white/10 shrink-0 cursor-pointer hover:border-white/30 transition-colors"
              title={`${purchase.game_name} - $${Number(purchase.price).toFixed(2)}`}
             onClick={() =>
    window.open(
      `https://store.steampowered.com/app/${purchase.game_appid}`,
      "_blank"
    )
  }
            />
          ))}
          
        </div>
      )}

      {/* Pending purchases inline */}
      {pendingForParticipant.length > 0 && (
        <div
          className="mt-2 flex items-center gap-2 overflow-x-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-yellow-400/70 text-[10px] font-bold shrink-0 animate-pulse">
            NUEVO
          </span>
          {pendingForParticipant.map((pp) => (
            <div key={pp.id} className="relative shrink-0 group">
              {editingPendingId === pp.id ? (
                <PriceEditor
                  initialValue={pp.price}
                  compact
                  onSave={(price) => {
                    onApprovePending(pp, price);
                    setEditingPendingId(null);
                  }}
                  onCancel={() => setEditingPendingId(null)}
                />
              ) : (
                <>
                  <img
                    src={pp.game_image || "/placeholder.svg"}
                    alt={pp.game_name}
                    className="h-10 w-[72px] sm:h-14 sm:w-[100px] object-cover rounded-md border-2 border-yellow-500/50 animate-pulse"
                    title={`${pp.game_name} - $${Number(pp.price).toFixed(2)} USD (pendiente)`}
                  />
                  {isAdmin && (
                    <div className="absolute inset-0 bg-black/70 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPendingId(pp.id);
                        }}
                        className="text-green-400 hover:text-green-300"
                        title="Aprobar (click para editar precio)"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRejectPending(pp.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
