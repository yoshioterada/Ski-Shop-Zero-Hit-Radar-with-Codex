package com.skishop.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
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
 * Pins the camelCase JSON contract described in front-design.md.
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
class FrontendContractIntegrationTests {

	private final MockMvc mockMvc;
	private final ObjectMapper objectMapper;
	private final ZeroHitSearchRepository zeroHitSearchRepository;

	@Autowired
	FrontendContractIntegrationTests(
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
	void productAuthRadarAiAndErrorPayloadsMatchFrontendTypes() throws Exception {
		mockMvc.perform(get("/api/products").param("limit", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(1)))
				.andExpect(jsonPath("$.items[0].id", notNullValue()))
				.andExpect(jsonPath("$.items[0].manufacturer", notNullValue()))
				.andExpect(jsonPath("$.items[0].name", notNullValue()))
				.andExpect(jsonPath("$.items[0].category", notNullValue()))
				.andExpect(jsonPath("$.items[0].description", notNullValue()))
				.andExpect(jsonPath("$.items[0].price", notNullValue()))
				.andExpect(jsonPath("$.items[0].stockStatus", notNullValue()))
				.andExpect(jsonPath("$.items[0].imageUrl", notNullValue()))
				.andExpect(jsonPath("$.items[0].createdAt", notNullValue()))
				.andExpect(jsonPath("$.items[0].updatedAt", notNullValue()))
				.andExpect(jsonPath("$.totalCount", is(100)));

		mockMvc.perform(get("/api/products/search")
						.param("q", "Frontend Contract Missing Product")
						.param("limit", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(0)))
				.andExpect(jsonPath("$.totalCount", is(0)))
				.andExpect(jsonPath("$.zeroHitRecorded", is(true)));

		String bearerToken = "Bearer " + loginToken();
		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, bearerToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.authenticated", is(true)))
				.andExpect(jsonPath("$.user.username", is("test-admin@example.com")))
				.andExpect(jsonPath("$.user.role", is("ADMIN")));

		mockMvc.perform(get("/api/admin/zero-hits").header(HttpHeaders.AUTHORIZATION, bearerToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items", hasSize(1)))
				.andExpect(jsonPath("$.items[0].id", notNullValue()))
				.andExpect(jsonPath("$.items[0].keyword", is("Frontend Contract Missing Product")))
				.andExpect(jsonPath("$.items[0].normalizedKeyword", is("frontend contract missing product")))
				.andExpect(jsonPath("$.items[0].hitCount", is(1)))
				.andExpect(jsonPath("$.items[0].priority", is("LOW")))
				.andExpect(jsonPath("$.items[0].estimatedOpportunityLoss", notNullValue()))
				.andExpect(jsonPath("$.items[0].firstSearchedAt", notNullValue()))
				.andExpect(jsonPath("$.items[0].lastSearchedAt", notNullValue()))
				.andExpect(jsonPath("$.summary.zeroHitKeywordCount", is(1)))
				.andExpect(jsonPath("$.summary.searchVolume", is(1)))
				.andExpect(jsonPath("$.summary.estimatedOpportunityLoss", notNullValue()));

		mockMvc.perform(post("/api/admin/ai-consult")
						.header(HttpHeaders.AUTHORIZATION, bearerToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "keyword": "Frontend Contract Missing Product",
								  "question": "仕入れ判断の観点を教えてください"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.answer", notNullValue()))
				.andExpect(jsonPath("$.providerStatus", is("FALLBACK")));

		mockMvc.perform(get("/api/admin/zero-hits"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.timestamp", notNullValue()))
				.andExpect(jsonPath("$.status", is(401)))
				.andExpect(jsonPath("$.message", is("Unauthorized")))
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_REQUIRED")))
				.andExpect(jsonPath("$.path", is("/api/admin/zero-hits")))
				.andExpect(jsonPath("$.errors").exists());

		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"","password":""}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status", is(400)))
				.andExpect(jsonPath("$.message", is("Invalid request")))
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")))
				.andExpect(jsonPath("$.path", is("/api/auth/login")))
				.andExpect(jsonPath("$.errors.username", notNullValue()))
				.andExpect(jsonPath("$.errors.password", notNullValue()));

		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"test-admin@example.com","password":"wrong-password"}
								"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status", is(401)))
				.andExpect(jsonPath("$.message", is("Unauthorized")))
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_FAILED")))
				.andExpect(jsonPath("$.errors").exists());

		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status", is(401)))
				.andExpect(jsonPath("$.code", is("INVALID_TOKEN")))
				.andExpect(jsonPath("$.errors", notNullValue()));
	}

	@Test
	void authMeDtoAllowsUnauthenticatedUserToBeNullWhenSerializedDirectly() throws Exception {
		com.skishop.dto.AuthMeResponse response = new com.skishop.dto.AuthMeResponse(false, null);
		JsonNode payload = objectMapper.readTree(objectMapper.writeValueAsString(response));
		org.assertj.core.api.Assertions.assertThat(payload.get("authenticated").asBoolean()).isFalse();
		org.assertj.core.api.Assertions.assertThat(payload.get("user").isNull()).isTrue();
		mockMvc.perform(get("/api/auth/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_REQUIRED")))
				.andExpect(jsonPath("$.user").doesNotExist());
	}

	private String loginToken() throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"test-admin@example.com","password":"test-password"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success", is(true)))
				.andExpect(jsonPath("$.token", notNullValue()))
				.andExpect(jsonPath("$.user.username", is("test-admin@example.com")))
				.andExpect(jsonPath("$.user.role", is("ADMIN")))
				.andReturn();
		JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
		return payload.get("token").asText();
	}
}
