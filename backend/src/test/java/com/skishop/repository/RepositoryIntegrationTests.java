package com.skishop.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.skishop.entity.Priority;
import com.skishop.entity.Product;
import com.skishop.entity.ZeroHitSearch;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Verifies Flyway schema, deterministic seed data, constraints, and repository queries.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate"
})
class RepositoryIntegrationTests {

	private final ProductRepository productRepository;
	private final ZeroHitSearchRepository zeroHitSearchRepository;
	private final JdbcTemplate jdbcTemplate;

	@Autowired
	RepositoryIntegrationTests(
			ProductRepository productRepository,
			ZeroHitSearchRepository zeroHitSearchRepository,
			JdbcTemplate jdbcTemplate) {
		this.productRepository = productRepository;
		this.zeroHitSearchRepository = zeroHitSearchRepository;
		this.jdbcTemplate = jdbcTemplate;
	}

	@Test
	void productsTableHasDesignedColumnsAndIndexes() {
		assertColumns("products", Set.of(
				"id",
				"manufacturer",
				"name",
				"category",
				"description",
				"price",
				"stock_status",
				"image_url",
				"created_at",
				"updated_at"));

		assertIndexes("products", Set.of(
				"idx_products_name_lower",
				"idx_products_manufacturer_lower",
				"idx_products_category"));
	}

	@Test
	void zeroHitSearchesTableHasDesignedColumnsIndexesAndUniqueConstraint() {
		assertColumns("zero_hit_searches", Set.of(
				"id",
				"keyword",
				"normalized_keyword",
				"hit_count",
				"priority",
				"estimated_opportunity_loss",
				"first_searched_at",
				"last_searched_at"));

		assertIndexes("zero_hit_searches", Set.of(
				"uk_zero_hit_normalized_keyword",
				"idx_zero_hit_hit_count",
				"idx_zero_hit_last_searched_at"));
	}

	@Test
	void productSeedContainsOneHundredCompleteRowsAndRequiredCategories() {
		assertThat(productRepository.count()).isEqualTo(100);

		assertThat(productRepository.findDistinctCategories()).containsExactly(
				"bindings",
				"gloves",
				"goggles",
				"helmets",
				"poles",
				"ski boots",
				"skis",
				"tuning goods",
				"wax",
				"wear");

		Integer incompleteRows = jdbcTemplate.queryForObject("""
				select count(*)
				from products
				where manufacturer is null
				   or name is null
				   or category is null
				   or description is null
				   or price is null
				   or stock_status is null
				""", Integer.class);
		assertThat(incompleteRows).isZero();
	}

	@Test
	void productRepositorySupportsInitialListSearchAverageAndAiContextQueries() {
		List<Product> initialProducts = productRepository.findInitialProducts(null, PageRequest.of(0, 20));
		assertThat(initialProducts).hasSize(20);

		List<Product> atomicProducts = productRepository.searchProducts("atomic", null, PageRequest.of(0, 50));
		assertThat(atomicProducts)
				.isNotEmpty()
				.allSatisfy(product -> assertThat(searchableText(product)).contains("atomic"));

		List<Product> filteredBoots = productRepository.searchProducts("hawx", "ski boots", PageRequest.of(0, 10));
		assertThat(filteredBoots)
				.extracting(Product::getName)
				.containsExactly("Hawx Prime 110 S GW");

		assertThat(productRepository.averagePrice()).isGreaterThan(BigDecimal.ZERO);
		assertThat(productRepository.findDistinctManufacturers()).contains("Atomic", "Salomon", "Rossignol", "Swix");
	}

	@Test
	void zeroHitRepositoryPreventsDuplicateNormalizedKeywordsAndProvidesSummaryQueries() {
		Instant baseTime = Instant.parse("2026-02-01T10:00:00Z");
		ZeroHitSearch first = ZeroHitSearch.restore(
				UUID.fromString("10000000-0000-0000-0000-000000000001"),
				"Powder Finder",
				"powder finder",
				3,
				Priority.MEDIUM,
				new BigDecimal("150000.00"),
				baseTime.minusSeconds(3600),
				baseTime);
		ZeroHitSearch second = ZeroHitSearch.restore(
				UUID.fromString("10000000-0000-0000-0000-000000000002"),
				"Kids Touring",
				"kids touring",
				6,
				Priority.HIGH,
				new BigDecimal("300000.00"),
				baseTime.minusSeconds(7200),
				baseTime.plusSeconds(60));
		zeroHitSearchRepository.saveAllAndFlush(List.of(first, second));

		assertThat(zeroHitSearchRepository.findByNormalizedKeyword("powder finder"))
				.isPresent()
				.get()
				.extracting(ZeroHitSearch::getHitCount)
				.isEqualTo(3);

		List<ZeroHitSearch> radarItems = zeroHitSearchRepository.findRadarItems(
				baseTime.minusSeconds(10),
				PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "hitCount")));
		assertThat(radarItems)
				.extracting(ZeroHitSearch::getNormalizedKeyword)
				.containsExactly("kids touring", "powder finder");

		assertThat(zeroHitSearchRepository.sumHitCount(baseTime.minusSeconds(10))).isEqualTo(9);
		assertThat(zeroHitSearchRepository.sumEstimatedOpportunityLoss(baseTime.minusSeconds(10)))
				.isEqualByComparingTo("450000.00");

		ZeroHitSearch duplicate = ZeroHitSearch.restore(
				UUID.fromString("10000000-0000-0000-0000-000000000003"),
				"Powder   Finder",
				"powder finder",
				1,
				Priority.LOW,
				new BigDecimal("50000.00"),
				baseTime,
				baseTime);
		assertThatThrownBy(() -> zeroHitSearchRepository.saveAndFlush(duplicate))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	private String searchableText(Product product) {
		return String.join(" ",
				product.getManufacturer(),
				product.getName(),
				product.getCategory(),
				product.getDescription()).toLowerCase();
	}

	private void assertColumns(String tableName, Set<String> expectedColumns) {
		Set<String> actualColumns = jdbcTemplate.execute((ConnectionCallback<Set<String>>) connection -> {
			try (ResultSet columns = connection.getMetaData().getColumns(null, null, tableName, null)) {
				Set<String> names = new java.util.LinkedHashSet<>();
				while (columns.next()) {
					names.add(columns.getString("COLUMN_NAME").toLowerCase());
				}
				return names;
			}
		});
		assertThat(actualColumns).containsAll(expectedColumns);
	}

	private void assertIndexes(String tableName, Set<String> expectedIndexes) {
		Set<String> actualIndexes = jdbcTemplate.execute((ConnectionCallback<Set<String>>) connection -> {
			try (ResultSet indexes = connection.getMetaData().getIndexInfo(null, null, tableName, false, false)) {
				Set<String> names = new java.util.LinkedHashSet<>();
				while (indexes.next()) {
					String indexName = indexes.getString("INDEX_NAME");
					if (indexName != null) {
						names.add(indexName.toLowerCase());
					}
				}
				return names;
			}
		});
		for (String expectedIndex : expectedIndexes) {
			assertThat(actualIndexes)
					.anySatisfy(actualIndex -> assertThat(actualIndex).startsWith(expectedIndex));
		}
	}
}
