CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  hostname TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  referrer_domain TEXT DEFAULT '',
  device_type TEXT DEFAULT 'desktop',
  browser TEXT DEFAULT '',
  os TEXT DEFAULT '',
  country TEXT DEFAULT '',
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  time_on_page INTEGER DEFAULT 0,
  is_entry BOOLEAN DEFAULT false,
  is_bounce BOOLEAN DEFAULT true,
  screen_width INTEGER DEFAULT 0
);

CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_visitor_id ON analytics_events(visitor_id);
CREATE INDEX idx_analytics_page_path ON analytics_events(page_path);
CREATE INDEX idx_analytics_country ON analytics_events(country);

CREATE TABLE analytics_salts (
  date TEXT PRIMARY KEY,
  salt TEXT NOT NULL
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_salts ENABLE ROW LEVEL SECURITY;
