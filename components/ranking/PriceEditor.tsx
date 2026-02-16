"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface PriceEditorProps {
  initialValue: number;
  onSave: (price: number) => void;
  onCancel: () => void;
  compact?: boolean;
}

export function PriceEditor({ initialValue, onSave, onCancel, compact }: PriceEditorProps) {
  const [value, setValue] = useState(String(initialValue.toFixed(2)));

  const submit = () => {
    const parsed = parseFloat(value);
    if (parsed > 0) onSave(parsed);
    else onSave(initialValue);
  };

  const height = compact ? "h-5" : "h-6";
  const text = compact ? "text-[10px]" : "text-xs";

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <span className={`text-white/40 ${text}`}>$</span>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value) submit();
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        className={`${height} w-20 ${text} bg-white/10 border-white/20 text-white px-1.5`}
        placeholder={String(initialValue.toFixed(2))}
      />
      <Button
        size="sm"
        onClick={submit}
        className={`bg-green-600 hover:bg-green-700 ${height} px-2 ${text}`}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className={`${height} px-1 text-white/40 hover:text-white`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
