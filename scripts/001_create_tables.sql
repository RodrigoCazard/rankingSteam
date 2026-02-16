-- Tabla de participantes
CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Jugador',
  image_url TEXT DEFAULT '',
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de compras/juegos agregados
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  game_appid INTEGER NOT NULL,
  game_image TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  steam_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar 4 participantes iniciales
INSERT INTO participants (name, image_url, total_spent) VALUES
  ('Jugador 1', '', 0),
  ('Jugador 2', '', 0),
  ('Jugador 3', '', 0),
  ('Jugador 4', '', 0);

-- Deshabilitar RLS para estas tablas (acceso publico para lectura, admin para escritura via password)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Politicas para lectura publica
CREATE POLICY "Allow public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow public read purchases" ON purchases FOR SELECT USING (true);

-- Politicas para escritura publica (el admin password se valida en el backend)
CREATE POLICY "Allow public insert participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update participants" ON participants FOR UPDATE USING (true);
CREATE POLICY "Allow public delete participants" ON participants FOR DELETE USING (true);

CREATE POLICY "Allow public insert purchases" ON purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update purchases" ON purchases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete purchases" ON purchases FOR DELETE USING (true);
