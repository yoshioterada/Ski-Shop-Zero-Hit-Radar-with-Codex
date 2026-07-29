package com.skishop.service;

import com.skishop.entity.ZeroHitSearch;
import com.skishop.repository.ZeroHitSearchRepository;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import javax.sql.DataSource;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Executes PostgreSQL-native zero-hit upserts without a read-modify-write window.
 */
@Repository
public class ZeroHitAtomicUpsertGateway {

	private static final String POSTGRESQL = "postgresql";

	private static final String UPSERT_SQL = """
			INSERT INTO zero_hit_searches (
				id,
				keyword,
				normalized_keyword,
				hit_count,
				priority,
				estimated_opportunity_loss,
				first_searched_at,
				last_searched_at
			)
			VALUES (
				:id,
				:keyword,
				:normalizedKeyword,
				1,
				'LOW',
				round((SELECT coalesce(avg(price), 0) FROM products) * 1, 2),
				:searchedAt,
				:searchedAt
			)
			ON CONFLICT (normalized_keyword) DO UPDATE SET
				keyword = EXCLUDED.keyword,
				hit_count = zero_hit_searches.hit_count + 1,
				last_searched_at = EXCLUDED.last_searched_at,
				estimated_opportunity_loss = round((SELECT coalesce(avg(price), 0) FROM products)
						* (zero_hit_searches.hit_count + 1), 2),
				priority = CASE
					WHEN zero_hit_searches.hit_count + 1 >= 5 THEN 'HIGH'
					WHEN zero_hit_searches.hit_count + 1 >= 2 THEN 'MEDIUM'
					ELSE 'LOW'
				END
			""";

	private final NamedParameterJdbcTemplate jdbcTemplate;
	private final DataSource dataSource;
	private final ZeroHitSearchRepository zeroHitSearchRepository;
	private volatile Boolean atomicUpsertSupported;

	public ZeroHitAtomicUpsertGateway(
			NamedParameterJdbcTemplate jdbcTemplate,
			DataSource dataSource,
			ZeroHitSearchRepository zeroHitSearchRepository) {
		this.jdbcTemplate = jdbcTemplate;
		this.dataSource = dataSource;
		this.zeroHitSearchRepository = zeroHitSearchRepository;
	}

	/**
	 * Returns whether the current database supports the PostgreSQL upsert statement used here.
	 */
	public boolean supportsAtomicUpsert() {
		Boolean cached = atomicUpsertSupported;
		if (cached != null) {
			return cached;
		}
		synchronized (this) {
			if (atomicUpsertSupported == null) {
				atomicUpsertSupported = databaseProductName().contains(POSTGRESQL);
			}
			return atomicUpsertSupported;
		}
	}

	/**
	 * Atomically inserts or increments a zero-hit aggregate and returns the persisted row.
	 */
	public ZeroHitSearch upsert(
			String displayKeyword,
			String normalizedKeyword,
			Instant searchedAt) {
		jdbcTemplate.update(UPSERT_SQL, Map.of(
				"id", UUID.randomUUID(),
				"keyword", displayKeyword,
				"normalizedKeyword", normalizedKeyword,
				"searchedAt", Timestamp.from(searchedAt)));
		return zeroHitSearchRepository.findByNormalizedKeyword(normalizedKeyword)
				.orElseThrow(() -> new IllegalStateException("zero-hit upsert did not persist a row"));
	}

	private String databaseProductName() {
		try (var connection = dataSource.getConnection()) {
			return connection.getMetaData().getDatabaseProductName().toLowerCase();
		}
		catch (SQLException ex) {
			throw new IllegalStateException("Unable to inspect database product", ex);
		}
	}
}
