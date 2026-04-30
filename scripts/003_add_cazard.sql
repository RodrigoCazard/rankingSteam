-- Agregar participante Cazard
INSERT INTO participants (name, avatar_url, steam_id, country_code, known_appids)
VALUES ('Cazard', 'https://avatars.fastly.steamstatic.com/4028d8c1ad00ee8a4b4c8ed9bd7cbe1a0d4238fd_full.jpg', 'Cazard2399', 'US', '[]')
ON CONFLICT DO NOTHING;
