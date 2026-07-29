package com.skishop.exception;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

/**
 * Writes controlled API error JSON from places outside MVC exception handling, such as Spring Security.
 */
@Component
public class ApiErrorWriter {

	private final ObjectMapper objectMapper;

	public ApiErrorWriter(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	/**
	 * Writes a sanitized error response without exposing implementation details.
	 *
	 * @param response servlet response
	 * @param status HTTP status code
	 * @param message safe user-facing message
	 * @param code stable machine-readable error code
	 * @param path request path
	 * @throws IOException when the servlet response cannot be written
	 */
	public void write(HttpServletResponse response, int status, String message, String code, String path)
			throws IOException {
		response.setStatus(status);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		ApiErrorResponse payload = new ApiErrorResponse(Instant.now(), status, message, code, path, Map.of());
		objectMapper.writeValue(response.getOutputStream(), payload);
	}
}
