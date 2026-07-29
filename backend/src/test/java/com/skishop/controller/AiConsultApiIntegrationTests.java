package com.skishop.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Verifies the protected AI consultation endpoint and fallback behavior.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate",
		"app.ai.api-key="
})
class AiConsultApiIntegrationTests {

	private final MockMvc mockMvc;
	private final ObjectMapper objectMapper;

	@Autowired
	AiConsultApiIntegrationTests(MockMvc mockMvc, ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.objectMapper = objectMapper;
	}

	@Test
	void aiConsultRejectsRequestsWithoutToken() throws Exception {
		mockMvc.perform(post("/api/admin/ai-consult")
						.contentType(MediaType.APPLICATION_JSON)
						.content(validRequestJson()))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_REQUIRED")));
	}

	@Test
	void blankQuestionReturnsValidationError() throws Exception {
		mockMvc.perform(post("/api/admin/ai-consult")
						.header(HttpHeaders.AUTHORIZATION, bearerToken())
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"keyword":"Powder Finder","question":"","hitCount":3}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
	}

	@Test
	void invalidAiConsultFieldsReturnValidationError() throws Exception {
		String token = bearerToken();

		mockMvc.perform(post("/api/admin/ai-consult")
						.header(HttpHeaders.AUTHORIZATION, token)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"keyword":"Powder Finder","question":"%s","hitCount":3}
								""".formatted("x".repeat(1001))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

		mockMvc.perform(post("/api/admin/ai-consult")
						.header(HttpHeaders.AUTHORIZATION, token)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"keyword":"Powder Finder","question":"相談","hitCount":-1}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

		mockMvc.perform(post("/api/admin/ai-consult")
						.header(HttpHeaders.AUTHORIZATION, token)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"keyword":"Powder Finder","question":"相談","lastSearchedAt":"2999-01-01T00:00:00Z"}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
	}

	@Test
	void validTokenReturnsFallbackResponseWhenApiKeyIsMissing() throws Exception {
		mockMvc.perform(post("/api/admin/ai-consult")
						.header(HttpHeaders.AUTHORIZATION, bearerToken())
						.contentType(MediaType.APPLICATION_JSON)
						.content(validRequestJson()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.providerStatus", is("FALLBACK")))
				.andExpect(jsonPath("$.answer", containsString("結論")))
				.andExpect(jsonPath("$.answer", containsString("AI_API_KEY が未設定")))
				.andExpect(jsonPath("$.answer", containsString("次のアクション")));
	}

	private String validRequestJson() {
		return """
				{
				  "keyword": "Powder Finder",
				  "question": "今季に仕入れるべきか判断してください",
				  "hitCount": 3,
				  "lastSearchedAt": "2026-02-01T10:15:30Z"
				}
				""";
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
