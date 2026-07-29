package com.skishop.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Successful admin login response.
 *
 * @param isSuccess always true for successful login
 * @param token opaque bearer token
 * @param user authenticated admin identity
 */
public record LoginResponse(
		@JsonProperty("success") boolean isSuccess,
		String token,
		AdminUserDto user
) {
}
