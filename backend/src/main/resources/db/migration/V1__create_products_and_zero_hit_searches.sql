CREATE TABLE products (
    id UUID PRIMARY KEY,
    manufacturer VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock_status VARCHAR(40) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_products_stock_status CHECK (stock_status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')),
    CONSTRAINT chk_products_price_non_negative CHECK (price >= 0)
);

CREATE TABLE zero_hit_searches (
    id UUID PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    normalized_keyword VARCHAR(255) NOT NULL,
    hit_count INTEGER NOT NULL,
    priority VARCHAR(20) NOT NULL,
    estimated_opportunity_loss NUMERIC(12, 2),
    first_searched_at TIMESTAMP NOT NULL,
    last_searched_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_zero_hit_normalized_keyword UNIQUE (normalized_keyword),
    CONSTRAINT chk_zero_hit_hit_count_positive CHECK (hit_count >= 1),
    CONSTRAINT chk_zero_hit_priority CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'))
);

CREATE INDEX idx_products_name_lower ON products (name);
CREATE INDEX idx_products_manufacturer_lower ON products (manufacturer);
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_zero_hit_hit_count ON zero_hit_searches (hit_count);
CREATE INDEX idx_zero_hit_last_searched_at ON zero_hit_searches (last_searched_at);
