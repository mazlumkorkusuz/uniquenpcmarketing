-- Steam Co-op Games tablosu
-- Hem co-op hem non-co-op oyunları saklar (is_coop flag ile).
-- Non-co-op kayıtlar sayesinde script aynı oyunu tekrar kontrol etmez.
-- 7 günden eski kayıtlar günlük script tarafından otomatik silinir.

CREATE TABLE IF NOT EXISTS steam_coop_games (
  appid             TEXT        PRIMARY KEY,
  name              TEXT        NOT NULL,
  release_date      TEXT        NOT NULL,       -- Ham Steam string: "23 Sep, 2026"
  release_date_iso  DATE        NOT NULL,       -- Filtreleme/silme için: 2026-09-23
  tiny_image        TEXT        NOT NULL,
  price_final       INTEGER,                    -- Steam cent cinsinden: 2499 = $24.99
  price_initial     INTEGER,
  discount_percent  INTEGER,
  coop_types        TEXT[]      NOT NULL DEFAULT '{}', -- ["Co-op", "Online Co-op"] veya boş
  is_coop           BOOLEAN     NOT NULL DEFAULT FALSE,
  checked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sorgu performansı için index'ler
CREATE INDEX IF NOT EXISTS idx_steam_coop_release_date ON steam_coop_games (release_date_iso);
CREATE INDEX IF NOT EXISTS idx_steam_coop_is_coop       ON steam_coop_games (is_coop);

-- Sadece co-op + son 7 gün sorgusunu hızlandırır (route'un yaptığı)
CREATE INDEX IF NOT EXISTS idx_steam_coop_active
  ON steam_coop_games (is_coop, release_date_iso DESC)
  WHERE is_coop = TRUE;

-- Sadece service role (route + script) erişir
ALTER TABLE steam_coop_games ENABLE ROW LEVEL SECURITY;
