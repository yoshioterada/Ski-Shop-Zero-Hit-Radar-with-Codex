package com.skishop.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skishop.config.FixedClockTestConfig;
import com.skishop.entity.Priority;
import com.skishop.entity.ZeroHitSearch;
import com.skishop.repository.ZeroHitSearchRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Verifies the protected Zero Hit Radar admin API contract.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(FixedClockTestConfig.class)
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate"
})
class AdminZeroHitApiIntegrationTests {

	private static final Instant NOW = Instant.parse("2026-02-01T10:15:30Z");

	private final MockMvc mockMvc;
	private final ObjectMapper objectMapper;
	private final ZeroHitSearchRepository zeroHitSearchRepository;

	@Autowired
	AdminZeroHitApiIntegrationTests(
			MockMvc mockMvc,
			ObjectMapper objectMapper,
			ZeroHitSearchRepository zeroHitSearchRepository) {
		this.mockMvc = mockMvc;
		this.objectMapper = objectMapper;
		this.zeroHitSearchRepository = zeroHitSearchRepository;
	}

	@BeforeEach
	void clearZeroHits() {
		zeroHitSearchRepository.deleteAll();
	}

	@Test
	void zeroHitsRejectRequestsWithoutToken() throws Exception {
		mockMvc.perform(get("/api/admin/zero-hits"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_REQUIRED")));
	}

	@Test
	void validAdminTokenReturnsCamelCaseItemsAndSummarySortedByHitCount() throws Exception {
		saveZeroHit("Powder Finder", "powder finder", 4, Priority.MEDIUM, "4000.00", NOW.minusSeconds(120));
		saveZeroHit("Race Plate", "race plate", 7, Priority.HIGH, "7000.50", NOW.minusSeconds(60));
		saveZeroHit("Kids Touring", "kids touring", 2, Priority.MEDIUM, "2000.25", NOW.minusSeconds(30));

		MvcResult result = mockMvc.perform(get("/api/admin/zero-hits")
						.header(HttpHeaders.AUTHORIZATION, bearerToken())
						.param("days", "30")
						.param("sort", "hitCount,desc")
						.param("limit", "2"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(2)))
				.andExpect(jsonPath("$.items[0].keyword", is("Race Plate")))
				.andExpect(jsonPath("$.items[0].normalizedKeyword", is("race plate")))
				.andExpect(jsonPath("$.items[0].hitCount", is(7)))
				.andExpect(jsonPath("$.items[0].priority", is("HIGH")))
				.andExpect(jsonPath("$.items[0].estimatedOpportunityLoss", is(7000.50)))
				.andExpect(jsonPath("$.items[0].firstSearchedAt", is(NOW.minusSeconds(120).toString())))
				.andExpect(jsonPath("$.items[0].lastSearchedAt", is(NOW.minusSeconds(60).toString())))
				.andExpect(jsonPath("$.items[1].keyword", is("Powder Finder")))
				.andExpect(jsonPath("$.summary.zeroHitKeywordCount", is(3)))
				.andExpect(jsonPath("$.summary.searchVolume", is(13)))
				.andReturn();

		JsonNode summary = objectMapper.readTree(result.getResponse().getContentAsString()).get("summary");
		assertThat(summary.get("estimatedOpportunityLoss").decimalValue()).isEqualByComparingTo("13000.75");
	}

	@Test
	void lastSearchedAtSortReturnsNewestItemsFirst() throws Exception {
		saveZeroHit("Older", "older", 9, Priority.HIGH, "9000.00", NOW.minusSeconds(300));
		saveZeroHit("Newest", "newest", 1, Priority.LOW, "1000.00", NOW.minusSeconds(10));

		mockMvc.perform(get("/api/admin/zero-hits")
						.header(HttpHeaders.AUTHORIZATION, bearerToken())
						.param("sort", "lastSearchedAt,desc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[0].keyword", is("Newest")))
				.andExpect(jsonPath("$.items[1].keyword", is("Older")));
	}

	@Test
	void daysFilterReturnsOnlyRecentZeroHitsAndMatchingSummary() throws Exception {
		saveZeroHit("Recent", "recent", 3, Priority.MEDIUM, "3000.00", NOW.minus(6, java.time.temporal.ChronoUnit.DAYS));
		saveZeroHit("Old", "old", 8, Priority.HIGH, "8000.00", NOW.minus(8, java.time.temporal.ChronoUnit.DAYS));

		mockMvc.perform(get("/api/admin/zero-hits")
						.header(HttpHeaders.AUTHORIZATION, bearerToken())
						.param("days", "7"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(1)))
				.andExpect(jsonPath("$.items[0].keyword", is("Recent")))
				.andExpect(jsonPath("$.summary.zeroHitKeywordCount", is(1)))
				.andExpect(jsonPath("$.summary.searchVolume", is(3)))
				.andExpect(jsonPath("$.summary.estimatedOpportunityLoss", is(3000.00)));
	}

	@Test
	void invalidLimitReturnsBadRequest() throws Exception {
		mockMvc.perform(get("/api/admin/zero-hits")
						.header(HttpHeaders.AUTHORIZATION, bearerToken())
						.param("limit", "0"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
	}

	@Test
	void invalidDaysAndSortReturnBadRequest() throws Exception {
		String token = bearerToken();
		mockMvc.perform(get("/api/admin/zero-hits")
						.header(HttpHeaders.AUTHORIZATION, token)
						.param("days", "0"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

		mockMvc.perform(get("/api/admin/zero-hits")
						.header(HttpHeaders.AUTHORIZATION, token)
						.param("sort", "bad"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
	}

	@Test
	void emptyZeroHitsReturnEmptyItemsAndZeroSummary() throws Exception {
		mockMvc.perform(get("/api/admin/zero-hits")
						.header(HttpHeaders.AUTHORIZATION, bearerToken()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(0)))
				.andExpect(jsonPath("$.summary.zeroHitKeywordCount", is(0)))
				.andExpect(jsonPath("$.summary.searchVolume", is(0)))
				.andExpect(jsonPath("$.summary.estimatedOpportunityLoss", is(0)));
	}

	private void saveZeroHit(
			String keyword,
			String normalizedKeyword,
			int hitCount,
			Priority priority,
			String estimatedOpportunityLoss,
			Instant lastSearchedAt) {
		zeroHitSearchRepository.save(ZeroHitSearch.restore(
				UUID.randomUUID(),
				keyword,
				normalizedKeyword,
				hitCount,
				priority,
				new BigDecimal(estimatedOpportunityLoss),
				firstSearchedAtFor(lastSearchedAt),
				lastSearchedAt));
	}

	private Instant firstSearchedAtFor(Instant lastSearchedAt) {
		Instant defaultFirstSearchedAt = NOW.minusSeconds(120);
		if (defaultFirstSearchedAt.isAfter(lastSearchedAt)) {
			return lastSearchedAt.minusSeconds(120);
		}
		return defaultFirstSearchedAt;
	}

	private String bearerToken() throws Exception {
		return "Bearer " + extractToken(login().andExpect(status().isOk()).andReturn());
	}

	private org.springframework.test.web.servlet.ResultActions login() throws Exception {
		return mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"username":"test-admin@example.com","password":"test-password"}
						"""));
	}

	private String extractToken(MvcResult result) throws Exception {
		JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
		return payload.get("token").asText();
	}
}
