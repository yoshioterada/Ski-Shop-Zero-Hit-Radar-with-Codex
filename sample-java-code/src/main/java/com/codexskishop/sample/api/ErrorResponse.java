package com.codexskishop.sample.api;

import java.time.Instant;

/**
 * Response body returned when the API rejects a request.
 */
public record ErrorResponse(String message, Instant occurredAt) {
}
