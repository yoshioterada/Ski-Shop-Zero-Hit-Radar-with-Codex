package com.skishop;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(BackendApplicationTests.TestEndpoints.class)
class BackendApplicationTests {

	private final MockMvc mockMvc;

	@Autowired
	BackendApplicationTests(MockMvc mockMvc) {
		this.mockMvc = mockMvc;
	}

	@Test
	void contextLoads() {
	}

	@Test
	void healthEndpointIsPublicAndReturnsOk() throws Exception {
		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("UP"));
	}

	@Test
	void protectedEndpointWithoutAuthenticationReturnsControlledError() throws Exception {
		mockMvc.perform(get("/test/protected"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status").value(401))
				.andExpect(jsonPath("$.message").value("Unauthorized"))
				.andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
	}

	@Test
	void validationErrorReturnsFrontendFriendlyJson() throws Exception {
		mockMvc.perform(post("/test/validation")
						.with(user("admin").roles("ADMIN"))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"name\":\"\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.message").value("Invalid request"))
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.errors.name").exists());
	}

	@Test
	void unexpectedErrorDoesNotExposeInternalDetails() throws Exception {
		mockMvc.perform(get("/test/unexpected").with(user("admin").roles("ADMIN")))
				.andExpect(status().isInternalServerError())
				.andExpect(jsonPath("$.status").value(500))
				.andExpect(jsonPath("$.message").value("Internal server error"))
				.andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
				.andExpect(content().string(not(containsString("database-password"))))
				.andExpect(content().string(not(containsString("IllegalStateException"))));
	}

	@TestConfiguration
	@RestController
	static class TestEndpoints {

		@GetMapping("/test/protected")
		TestResponse protectedEndpoint() {
			return new TestResponse("ok");
		}

		@PostMapping("/test/validation")
		TestResponse validationEndpoint(@Valid @RequestBody TestRequest request) {
			return new TestResponse(request.name());
		}

		@GetMapping("/test/unexpected")
		TestResponse unexpectedEndpoint() {
			throw new IllegalStateException("database-password should not be exposed");
		}
	}

	record TestRequest(@NotBlank String name) {
	}

	record TestResponse(String value) {
	}

}
