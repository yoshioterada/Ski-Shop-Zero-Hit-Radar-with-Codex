ALTER TABLE zero_hit_searches
    ALTER COLUMN estimated_opportunity_loss SET NOT NULL;

ALTER TABLE zero_hit_searches
    ADD CONSTRAINT chk_zero_hit_loss_non_negative CHECK (estimated_opportunity_loss >= 0);

ALTER TABLE zero_hit_searches
    ADD CONSTRAINT chk_zero_hit_search_time_order CHECK (first_searched_at <= last_searched_at);
