package com.skishop.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skishop.config.FixedClockTestConfig;
import com.skishop.repository.ZeroHitSearchRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.HealthEndpoint;
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
 * Covers the primary backend journey expected by the storefront and admin dashboard.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(FixedClockTestConfig.class)
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate",
		"app.ai.api-key="
})
class BackendJourneyIntegrationTests {

	private final MockMvc mockMvc;
	private final ObjectMapper objectMapper;
	private final ZeroHitSearchRepository zeroHitSearchRepository;
	private final HealthEndpoint healthEndpoint;

	@Autowired
	BackendJourneyIntegrationTests(
			MockMvc mockMvc,
			ObjectMapper objectMapper,
			ZeroHitSearchRepository zeroHitSearchRepository,
			HealthEndpoint healthEndpoint) {
		this.mockMvc = mockMvc;
		this.objectMapper = objectMapper;
		this.zeroHitSearchRepository = zeroHitSearchRepository;
		this.healthEndpoint = healthEndpoint;
	}

	@BeforeEach
	void clearZeroHits() {
		zeroHitSearchRepository.deleteAll();
	}

	@Test
	void storefrontSearchAdminRadarAndAiFallbackWorkAsOneJourney() throws Exception {
		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("UP")));
		assertThat(healthEndpoint.health().getStatus().getCode()).isEqualTo("UP");

		mockMvc.perform(get("/api/products").param("limit", "5"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(5)))
				.andExpect(jsonPath("$.totalCount", is(100)));

		mockMvc.perform(get("/api/products/search").param("q", "Atomic"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalCount", greaterThan(0)))
				.andExpect(jsonPath("$.zeroHitRecorded", is(false)));
		assertThat(zeroHitSearchRepository.count()).isZero();

		String keyword = "Phase Nine Touring Plate";
		mockMvc.perform(get("/api/products/search").param("q", keyword))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(0)))
				.andExpect(jsonPath("$.totalCount", is(0)))
				.andExpect(jsonPath("$.zeroHitRecorded", is(true)));

		mockMvc.perform(get("/api/products/search").param("q", "  phase   nine touring plate  "))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.zeroHitRecorded", is(true)));

		assertThat(zeroHitSearchRepository.findByNormalizedKeyword("phase nine touring plate"))
				.isPresent()
				.get()
				.satisfies(zeroHit -> assertThat(zeroHit.getHitCount()).isEqualTo(2));

		mockMvc.perform(get("/api/admin/zero-hits"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_REQUIRED")));

		String bearerToken = "Bearer " + loginToken();
		mockMvc.perform(get("/api/admin/zero-hits")
						.header(HttpHeaders.AUTHORIZATION, bearerToken)
							.param("sort", "hitCount,desc")
						.param("limit", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(1)))
				.andExpect(jsonPath("$.items[0].keyword", is("phase   nine touring plate")))
				.andExpect(jsonPath("$.items[0].normalizedKeyword", is("phase nine touring plate")))
				.andExpect(jsonPath("$.items[0].hitCount", is(2)))
				.andExpect(jsonPath("$.summary.zeroHitKeywordCount", is(1)))
				.andExpect(jsonPath("$.summary.searchVolume", is(2)));

		mockMvc.perform(post("/api/admin/ai-consult")
						.header(HttpHeaders.AUTHORIZATION, bearerToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "keyword": "Phase Nine Touring Plate",
								  "question": "この検索需要をどう扱うべきですか",
								  "hitCount": 2,
								  "lastSearchedAt": "2026-02-01T10:15:30Z"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.providerStatus", is("FALLBACK")))
				.andExpect(jsonPath("$.answer", containsString("結論")))
				.andExpect(jsonPath("$.answer", containsString("次のアクション")));
	}

	private String loginToken() throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"test-admin@example.com","password":"test-password"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success", is(true)))
				.andExpect(jsonPath("$.token", not(blankOrNullString())))
				.andReturn();
		JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
		return payload.get("token").asText();
	}
}
