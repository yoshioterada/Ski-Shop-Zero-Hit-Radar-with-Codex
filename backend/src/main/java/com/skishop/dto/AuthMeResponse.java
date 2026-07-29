package com.skishop.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Current admin authentication state.
 *
 * @param isAuthenticated true when the bearer token is valid
 * @param user authenticated admin identity
 */
public record AuthMeResponse(
		@JsonProperty("authenticated") boolean isAuthenticated,
		AdminUserDto user
) {
}
