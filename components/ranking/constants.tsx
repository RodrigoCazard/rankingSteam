import { Trophy as TrophyIcon } from "lucide-react";

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const RANK_TITLES = [
  "Dios Omnipotente",
  "Ballena Culona",
  "Ardilla Mamona",
  "Rata Suprema",
  "Garrapata Succionadora",
];

export function getRankTitle(index: number) {
  return RANK_TITLES[index] || "";
}

export function getTrophyIcon(position: number) {
  if (position === 1) return <TrophyIcon className="h-4 w-4 text-yellow-400" />;
  if (position === 2) return <TrophyIcon className="h-4 w-4 text-gray-300" />;
  if (position === 3) return <TrophyIcon className="h-4 w-4 text-amber-600" />;
  if (position === 5) return <span className="text-sm" title="Verguenza">🪳</span>;
  return null;
}

export function getMedal(index: number) {
  if (index === 0)
    return <TrophyIcon className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
  if (index === 1)
    return <TrophyIcon className="h-7 w-7 text-gray-300 drop-shadow-[0_0_6px_rgba(209,213,219,0.6)]" />;
  if (index === 2)
    return <TrophyIcon className="h-6 w-6 text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.6)]" />;
  return (
    <span className="w-6 h-6 flex items-center justify-center text-white/50 font-bold text-sm">
      {index + 1}
    </span>
  );
}
