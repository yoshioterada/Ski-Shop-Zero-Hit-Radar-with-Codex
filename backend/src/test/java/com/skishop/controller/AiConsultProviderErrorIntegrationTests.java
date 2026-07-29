package com.skishop.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skishop.service.AiProviderClient;
import com.skishop.service.AiProviderException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Verifies provider failures return controlled API responses instead of 500 errors.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(AiConsultProviderErrorIntegrationTests.ThrowingProviderConfig.class)
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate",
		"app.ai.api-key=test-key"
})
class AiConsultProviderErrorIntegrationTests {

	private final MockMvc mockMvc;
	private final ObjectMapper objectMapper;

	@Autowired
	AiConsultProviderErrorIntegrationTests(MockMvc mockMvc, ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.objectMapper = objectMapper;
	}

	@Test
	void providerErrorReturnsControlledErrorStatus() throws Exception {
		mockMvc.perform(post("/api/admin/ai-consult")
						.header(HttpHeaders.AUTHORIZATION, bearerToken())
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "keyword": "Powder Finder",
								  "question": "今季に仕入れるべきか判断してください",
								  "hitCount": 3,
								  "lastSearchedAt": "2026-02-01T10:15:30Z"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.providerStatus", is("ERROR")))
				.andExpect(jsonPath("$.answer", containsString("AI provider への接続で一時的な問題")))
				.andExpect(jsonPath("$.answer", containsString("次のアクション")));
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

	@TestConfiguration
	static class ThrowingProviderConfig {

		@Bean
		@Primary
		AiProviderClient throwingProviderClient() {
			return prompt -> {
				throw new AiProviderException("provider unavailable", new RuntimeException("connection refused"));
			};
		}
	}
}
