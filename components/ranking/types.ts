export interface Purchase {
  id: number;
  participant_id: number;
  game_name: string;
  game_image: string | null;
  game_appid: number | null;
  price: number;
}

export interface Trophy {
  id: number;
  participant_id: number;
  month: number;
  year: number;
  position: number;
  total_spent: number;
}

export interface Participant {
  id: number;
  name: string;
  avatar_url: string | null;
  country_code: string | null;
  total: number;
  purchases: Purchase[];
  trophies: Trophy[];
}

export interface SteamGame {
  appid: number;
  name: string;
  price: string;
  priceNum: number;
  originalPrice: string;
  currency: string;
  image: string;
}

export interface PendingPurchase {
  id: number;
  participant_id: number;
  game_name: string;
  game_appid: number;
  game_image: string | null;
  price: number;
  currency: string;
  detected_at: string;
}
