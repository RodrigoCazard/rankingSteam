-- Agregar campos de Steam a participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS steam_id text;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'US';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS known_appids jsonb DEFAULT '[]';

-- Eliminar tabla known_games si existe (migrada a campo jsonb en participants)
DROP TABLE IF EXISTS known_games;

-- Tabla de compras pendientes de aprobación
CREATE TABLE IF NOT EXISTS pending_purchases (
  id serial PRIMARY KEY,
  participant_id int REFERENCES participants(id) ON DELETE CASCADE,
  game_name text NOT NULL,
  game_appid int NOT NULL,
  game_image text,
  price decimal DEFAULT 0,
  currency text DEFAULT 'USD',
  detected_at timestamp DEFAULT now()
);
