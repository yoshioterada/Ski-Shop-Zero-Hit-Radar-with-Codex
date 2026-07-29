package com.skishop.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Verifies admin authentication, bearer authorization, CORS, and protected endpoint policy.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(AuthApiIntegrationTests.AdminProtectedTestEndpoint.class)
@TestPropertySource(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate"
})
class AuthApiIntegrationTests {

	private final MockMvc mockMvc;
	private final ObjectMapper objectMapper;

	@Autowired
	AuthApiIntegrationTests(MockMvc mockMvc, ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.objectMapper = objectMapper;
	}

	@Test
	void publicEndpointsRemainPublic() throws Exception {
		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/products"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/products/search").param("q", "Atomic"))
				.andExpect(status().isOk());
	}

	@Test
	void validLoginReturnsTokenAndAdminUser() throws Exception {
		MvcResult result = login("test-admin@example.com", "test-password")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success", is(true)))
				.andExpect(jsonPath("$.token", not(blankOrNullString())))
				.andExpect(jsonPath("$.user.username", is("test-admin@example.com")))
				.andExpect(jsonPath("$.user.role", is("ADMIN")))
				.andReturn();

		assertThat(extractToken(result)).isNotBlank();
	}

	@Test
	void invalidLoginReturnsUnauthorizedErrorPayload() throws Exception {
		login("test-admin@example.com", "wrong-password")
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status", is(401)))
				.andExpect(jsonPath("$.message", is("Unauthorized")))
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_FAILED")));
	}

	@Test
	void repeatedInvalidLoginsAreRateLimitedByUsernameAndSourceIp() throws Exception {
		for (int i = 0; i < 5; i++) {
			loginFrom("test-admin@example.com", "wrong-password", "203.0.113.77")
					.andExpect(status().isUnauthorized())
					.andExpect(jsonPath("$.code", is("AUTHENTICATION_FAILED")));
		}

		loginFrom("test-admin@example.com", "test-password", "203.0.113.77")
				.andExpect(status().isTooManyRequests())
				.andExpect(jsonPath("$.code", is("RATE_LIMITED")));

		loginFrom("test-admin@example.com", "test-password", "203.0.113.78")
				.andExpect(status().isOk());
	}

	@Test
	void loginValidationReturnsBadRequest() throws Exception {
		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"username\":\"\",\"password\":\"\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
	}

	@Test
	void meRequiresValidBearerToken() throws Exception {
		mockMvc.perform(get("/api/auth/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_REQUIRED")));

		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("INVALID_TOKEN")));

		String token = extractToken(login("test-admin@example.com", "test-password")
				.andExpect(status().isOk())
				.andReturn());

		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.authenticated", is(true)))
				.andExpect(jsonPath("$.user.username", is("test-admin@example.com")))
				.andExpect(jsonPath("$.user.role", is("ADMIN")));
	}

	@Test
	void logoutRevokesCurrentBearerToken() throws Exception {
		String token = extractToken(login("test-admin@example.com", "test-password")
				.andExpect(status().isOk())
				.andReturn());

		mockMvc.perform(post("/api/auth/logout").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("INVALID_TOKEN")));
	}

	@Test
	void fourthLoginInvalidatesOldestActiveToken() throws Exception {
		String first = extractToken(login("test-admin@example.com", "test-password").andExpect(status().isOk()).andReturn());
		String second = extractToken(login("test-admin@example.com", "test-password").andExpect(status().isOk()).andReturn());
		String third = extractToken(login("test-admin@example.com", "test-password").andExpect(status().isOk()).andReturn());
		String fourth = extractToken(login("test-admin@example.com", "test-password").andExpect(status().isOk()).andReturn());

		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + first))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("INVALID_TOKEN")));
		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + second))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + third))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + fourth))
				.andExpect(status().isOk());
	}

	@Test
	void adminEndpointRequiresAdminRoleAndAcceptsValidToken() throws Exception {
		mockMvc.perform(get("/api/admin/protected"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("AUTHENTICATION_REQUIRED")));

		mockMvc.perform(get("/api/admin/protected").header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code", is("INVALID_TOKEN")));

		String token = extractToken(login("test-admin@example.com", "test-password")
				.andExpect(status().isOk())
				.andReturn());

		mockMvc.perform(get("/api/admin/protected").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.value", is("admin-ok")));
	}

	@Test
	void corsAllowsConfiguredFrontendOrigin() throws Exception {
		mockMvc.perform(options("/api/products")
						.header(HttpHeaders.ORIGIN, "http://localhost:3000")
						.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
				.andExpect(status().isOk())
				.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000"));
	}

	private org.springframework.test.web.servlet.ResultActions login(String username, String password) throws Exception {
		return mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"username":"%s","password":"%s"}
						""".formatted(username, password)));
	}

	private org.springframework.test.web.servlet.ResultActions loginFrom(String username, String password, String sourceIp) throws Exception {
		return mockMvc.perform(post("/api/auth/login")
				.header("X-Forwarded-For", sourceIp)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"username":"%s","password":"%s"}
						""".formatted(username, password)));
	}

	private String extractToken(MvcResult result) throws Exception {
		JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
		return payload.get("token").asText();
	}

	@TestConfiguration
	@RestController
	static class AdminProtectedTestEndpoint {

		@GetMapping("/api/admin/protected")
		TestResponse protectedEndpoint() {
			return new TestResponse("admin-ok");
		}
	}

	record TestResponse(String value) {
	}
}
