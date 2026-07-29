package com.skishop.controller;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skishop.config.FixedClockTestConfig;
import com.skishop.repository.ZeroHitSearchRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Verifies the public product API contract used by the Next.js frontend.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(FixedClockTestConfig.class)
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate"
})
class ProductApiIntegrationTests {

	private final MockMvc mockMvc;
	private final ZeroHitSearchRepository zeroHitSearchRepository;

	@Autowired
	ProductApiIntegrationTests(MockMvc mockMvc, ZeroHitSearchRepository zeroHitSearchRepository) {
		this.mockMvc = mockMvc;
		this.zeroHitSearchRepository = zeroHitSearchRepository;
	}

	@BeforeEach
	void clearZeroHits() {
		zeroHitSearchRepository.deleteAll();
	}

	@Test
	void listProductsReturnsCamelCaseProductListForInitialDisplay() throws Exception {
		mockMvc.perform(get("/api/products")
						.param("limit", "20")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()", is(20)))
				.andExpect(jsonPath("$.totalCount", is(100)))
				.andExpect(jsonPath("$.items[0].id", notNullValue()))
				.andExpect(jsonPath("$.items[0].manufacturer", notNullValue()))
				.andExpect(jsonPath("$.items[0].name", notNullValue()))
				.andExpect(jsonPath("$.items[0].category", notNullValue()))
				.andExpect(jsonPath("$.items[0].description", notNullValue()))
				.andExpect(jsonPath("$.items[0].price", notNullValue()))
				.andExpect(jsonPath("$.items[0].stockStatus", notNullValue()))
				.andExpect(jsonPath("$.items[0].imageUrl", notNullValue()))
				.andExpect(jsonPath("$.items[0].createdAt", notNullValue()))
				.andExpect(jsonPath("$.items[0].updatedAt", notNullValue()));
	}

	@Test
	void searchProductsMatchesManufacturerNameCategoryAndDescription() throws Exception {
		mockMvc.perform(get("/api/products/search")
						.param("q", "Atomic")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalCount", greaterThan(0)))
				.andExpect(jsonPath("$.zeroHitRecorded", is(false)))
				.andExpect(jsonPath("$.items[*].manufacturer", hasItem("Atomic")));

		mockMvc.perform(get("/api/products/search")
						.param("q", "Hawx")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[*].name", hasItem("Hawx Prime 110 S GW")));

		mockMvc.perform(get("/api/products/search")
						.param("q", "goggles")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[*].category", everyItem(is("goggles"))));

		mockMvc.perform(get("/api/products/search")
						.param("q", "weatherproof")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()", greaterThan(0)));
	}

	@Test
	void blankSearchReturnsControlledProductListWithoutZeroHitRecording() throws Exception {
		mockMvc.perform(get("/api/products/search")
						.param("q", "   ")
						.param("limit", "10")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()", is(10)))
				.andExpect(jsonPath("$.totalCount", is(100)))
				.andExpect(jsonPath("$.zeroHitRecorded", is(false)));
		assertThat(zeroHitSearchRepository.count()).isZero();
	}

	@Test
	void zeroResultSearchRecordsZeroHitOnlyForValidNonEmptySearches() throws Exception {
		mockMvc.perform(get("/api/products/search")
						.param("q", "No Such Ski Product")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()", is(0)))
				.andExpect(jsonPath("$.totalCount", is(0)))
				.andExpect(jsonPath("$.zeroHitRecorded", is(true)));

		assertThat(zeroHitSearchRepository.findByNormalizedKeyword("no such ski product"))
				.isPresent()
				.get()
				.satisfies(zeroHit -> {
					assertThat(zeroHit.getHitCount()).isEqualTo(1);
					assertThat(zeroHit.getPriority()).isEqualTo(com.skishop.entity.Priority.LOW);
				});

		mockMvc.perform(get("/api/products/search")
						.param("q", "  no   such ski product  ")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.zeroHitRecorded", is(true)));

		assertThat(zeroHitSearchRepository.count()).isEqualTo(1);
		assertThat(zeroHitSearchRepository.findByNormalizedKeyword("no such ski product"))
				.isPresent()
				.get()
				.extracting(zeroHit -> zeroHit.getHitCount())
				.isEqualTo(2);
	}

	@Test
	void matchingSearchDoesNotRecordZeroHit() throws Exception {
		mockMvc.perform(get("/api/products/search")
						.param("q", "Atomic")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalCount", greaterThan(0)))
				.andExpect(jsonPath("$.zeroHitRecorded", is(false)));

		assertThat(zeroHitSearchRepository.count()).isZero();
	}

	@Test
	void categoryFilterAppliesToListAndSearch() throws Exception {
		mockMvc.perform(get("/api/products")
						.param("category", "skis")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalCount", is(10)))
				.andExpect(jsonPath("$.items[*].category", everyItem(is("skis"))));

		mockMvc.perform(get("/api/products/search")
						.param("q", "boa")
						.param("category", "boots")
						.param("sort", "createdAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalCount", is(2)))
				.andExpect(jsonPath("$.items[*].category", everyItem(is("ski boots"))));
	}

	@Test
	void sortAndLimitAreValidated() throws Exception {
		mockMvc.perform(get("/api/products")
						.param("limit", "3")
						.param("sort", "price,asc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()", is(3)))
				.andExpect(jsonPath("$.items[0].name", is("Base Repair Candle Black")));

		mockMvc.perform(get("/api/products").param("limit", "0"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

		mockMvc.perform(get("/api/products").param("limit", "101"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

		mockMvc.perform(get("/api/products").param("limit", "abc"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("INVALID_PARAMETER")));

		mockMvc.perform(get("/api/products").param("sort", "name,asc"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
	}

	@Test
	void searchQueryAndCategoryLengthAreValidatedAtHttpBoundary() throws Exception {
		mockMvc.perform(get("/api/products/search")
						.param("q", "x".repeat(101)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

		mockMvc.perform(get("/api/products")
						.param("category", "x".repeat(81)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
	}

	@Test
	void publicProductEndpointsDoNotRequireAuthentication() throws Exception {
		mockMvc.perform(get("/api/products"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/products/search").param("q", "Atomic"))
				.andExpect(status().isOk());
	}
}
