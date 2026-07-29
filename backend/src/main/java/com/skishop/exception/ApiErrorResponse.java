package com.skishop.exception;

import java.time.Instant;
import java.util.Map;

/**
 * Frontend-friendly JSON error payload used consistently by controllers and security handlers.
 *
 * @param timestamp response creation time
 * @param status HTTP status code
 * @param message safe user-facing message
 * @param code stable machine-readable error code
 * @param path request path that failed
 * @param errors optional field-level validation messages
 */
public record ApiErrorResponse(
		Instant timestamp,
		int status,
		String message,
		String code,
		String path,
		Map<String, String> errors
) {
}
