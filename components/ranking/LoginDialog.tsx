"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lock } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
  error: string;
}

export function LoginDialog({
  open,
  onOpenChange,
  password,
  onPasswordChange,
  onLogin,
  error,
}: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Lock className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a2e] border-white/10 w-[90vw] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Admin</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onLogin()}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={onLogin} className="w-full bg-blue-600 hover:bg-blue-700">
            Entrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
