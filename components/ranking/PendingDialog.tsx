"use client";

import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Participant, PendingPurchase } from "./types";
import { PriceEditor } from "./PriceEditor";

interface PendingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingPurchases: PendingPurchase[];
  participants: Participant[];
  onApprove: (pending: PendingPurchase, customPrice?: number) => void;
  onReject: (id: number) => void;
}

export function PendingDialog({
  open,
  onOpenChange,
  pendingPurchases,
  participants,
  onApprove,
  onReject,
}: PendingDialogProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 w-[94vw] max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            Juegos detectados ({pendingPurchases.length})
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {pendingPurchases.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">
              No hay juegos pendientes de aprobacion
            </p>
          ) : (
            pendingPurchases.map((pending) => {
              const participantName =
                participants.find((p) => p.id === pending.participant_id)?.name ||
                "Desconocido";
              const isEditing = editingId === pending.id;

              return (
                <div
                  key={pending.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-yellow-500/20"
                >
                  <img
                    src={pending.game_image || "/placeholder.svg"}
                    alt={pending.game_name}
                    className="w-24 sm:w-36 h-[45px] sm:h-[68px] object-cover rounded-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{pending.game_name}</p>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <PriceEditor
                          initialValue={pending.price}
                          onSave={(price) => {
                            onApprove(pending, price);
                            setEditingId(null);
                          }}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <>
                          <p
                            className="text-green-400 text-xs font-bold cursor-pointer hover:text-green-300"
                            onClick={() => setEditingId(pending.id)}
                            title="Click para editar precio"
                          >
                            {pending.currency === "FREE"
                              ? "Gratis"
                              : `$${Number(pending.price).toFixed(2)} ${pending.currency}`}
                          </p>
                          <span className="text-white/30 text-xs">|</span>
                          <p className="text-blue-300 text-xs">{participantName}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(pending.id)}
                        className="p-1.5 rounded-md hover:bg-green-600/20 text-green-400/60 hover:text-green-400 transition-colors"
                        title="Aprobar (click para editar precio)"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(pending.id)}
                        className="p-1.5 rounded-md hover:bg-red-600/20 text-red-400/60 hover:text-red-400 transition-colors"
                        title="Rechazar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
