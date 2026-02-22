-- Create league_prizes table
CREATE TABLE IF NOT EXISTS league_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'cash')),
    badge VARCHAR(100),
    name VARCHAR(255),
    image_url TEXT,
    amount DECIMAL(15, 2),
    "order" INTEGER DEFAULT 0,
    league_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_league_prizes_league FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

-- Create league_banners table
CREATE TABLE IF NOT EXISTS league_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    tag VARCHAR(100),
    button_text VARCHAR(100),
    button_url TEXT,
    "order" INTEGER DEFAULT 0,
    league_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_league_banners_league FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_league_prizes_league_id ON league_prizes(league_id);
CREATE INDEX IF NOT EXISTS idx_league_banners_league_id ON league_banners(league_id);
