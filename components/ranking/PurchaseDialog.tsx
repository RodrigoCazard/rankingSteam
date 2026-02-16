"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Participant } from "./types";
import { PriceEditor } from "./PriceEditor";

interface PurchaseDialogProps {
  participant: Participant | null;
  isAdmin: boolean;
  onClose: () => void;
  onRemovePurchase: (purchaseId: number) => void;
  onUpdatePrice: (purchaseId: number, newPrice: number) => void;
  /** Update the local viewing state after a delete */
  onLocalUpdate: (updated: Participant | null) => void;
}

export function PurchaseDialog({
  participant,
  isAdmin,
  onClose,
  onRemovePurchase,
  onUpdatePrice,
  onLocalUpdate,
}: PurchaseDialogProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <Dialog
      open={!!participant}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setEditingId(null);
        }
      }}
    >
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-[94vw] sm:max-w-5xl w-[94vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            {participant?.avatar_url && (
              <img
                src={participant.avatar_url}
                alt=""
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
              />
            )}
            <div>
              <span className="text-xl sm:text-2xl">{participant?.name}</span>
              <p className="text-green-400 text-base sm:text-xl font-normal">
                ${participant?.total.toFixed(2)} gastados - {participant?.purchases.length} juegos
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {participant?.purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="rounded-lg bg-white/5 border border-white/10 overflow-hidden group relative"
              >
                <div className="relative">
                  <img
                    src={purchase.game_image || "/placeholder.svg"}
                    alt={purchase.game_name}
                    className="w-full h-24 sm:h-32 object-cover"
                  />
                  {isAdmin && editingId !== purchase.id && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={`https://store.steampowered.com/app/${purchase.game_appid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(purchase.id);
                        }}
                        className="p-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Editar precio"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePurchase(purchase.id);
                          if (participant.purchases.length <= 1) {
                            onLocalUpdate(null);
                          } else {
                            onLocalUpdate({
                              ...participant,
                              purchases: participant.purchases.filter(
                                (p) => p.id !== purchase.id
                              ),
                              total: participant.total - Number(purchase.price),
                            });
                          }
                        }}
                        className="p-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {!isAdmin && (
                    <a
                      href={`https://store.steampowered.com/app/${purchase.game_appid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="p-2">
                  <p
                    className="text-white text-xs font-medium truncate"
                    title={purchase.game_name}
                  >
                    {purchase.game_name}
                  </p>
                  {isAdmin && editingId === purchase.id ? (
                    <div className="mt-1">
                      <PriceEditor
                        initialValue={Number(purchase.price)}
                        onSave={(price) => {
                          onUpdatePrice(purchase.id, price);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <p
                      className={`text-green-400 text-sm font-bold mt-0.5 ${
                        isAdmin ? "cursor-pointer hover:text-green-300" : ""
                      }`}
                      onClick={() => {
                        if (isAdmin) setEditingId(purchase.id);
                      }}
                      title={isAdmin ? "Click para editar precio" : undefined}
                    >
                      ${Number(purchase.price).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
