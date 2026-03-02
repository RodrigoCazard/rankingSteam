"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays, RefreshCw, Bell, LogOut, Loader2 } from "lucide-react";
import { MONTH_NAMES } from "./constants";
import { LoginDialog } from "./LoginDialog";

interface HeaderProps {
  isAdmin: boolean;
  syncing: boolean;
  pendingCount: number;
  // Login
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  password: string;
  setPassword: (value: string) => void;
  loginError: string;
  handleLogin: () => void;
  // Admin actions
  onSync: () => void;
  onOpenPending: () => void;
  onCloseMonth: () => void;
  onLogout: () => void;
}

export function Header({
  isAdmin,
  syncing,
  pendingCount,
  loginOpen,
  setLoginOpen,
  password,
  setPassword,
  loginError,
  handleLogin,
  onSync,
  onOpenPending,
  onCloseMonth,
  onLogout,
}: HeaderProps) {
  const now = new Date();

  return (
    <div className="mb-6 shrink-0 relative">
      {/* Título medieval — verdaderamente centrado */}
      <div className="text-center py-1">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          Familia Mentirosos y Ratas Unidos
        </h1>
        <div className="flex items-center justify-center gap-1.5 text-white/40 text-sm mt-1 font-medium">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span className="italic">
            Temporada de {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
          </span>
        </div>
      </div>

      {/* Botones admin en posición absoluta para no afectar centrado */}
      <div className="absolute top-2 right-0">
        {!isAdmin ? (
          <LoginDialog
            open={loginOpen}
            onOpenChange={setLoginOpen}
            password={password}
            onPasswordChange={setPassword}
            onLogin={handleLogin}
            error={loginError}
          />
        ) : (
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSync}
              disabled={syncing}
              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
              title="Sincronizar bibliotecas de Steam"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenPending}
              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 relative"
              title="Pendientes de aprobacion"
            >
              <Bell className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCloseMonth}
              className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
              title="Cerrar Mes"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

