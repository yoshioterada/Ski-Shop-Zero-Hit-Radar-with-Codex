package com.skishop.service;

import com.skishop.dto.AdminUserDto;
import com.skishop.dto.LoginResponse;

import java.util.Optional;

import org.springframework.lang.Nullable;

/**
 * Admin authentication use case used by controllers and security filters.
 */
public interface AdminAuthUseCase {

	/**
	 * Authenticates admin credentials and issues an opaque session token.
	 *
	 * @param username submitted username
	 * @param password submitted password
	 * @return successful login response
	 */
	LoginResponse login(@Nullable String username, @Nullable String password, @Nullable String sourceIp);

	/**
	 * Validates an opaque bearer token.
	 *
	 * @param token optional bearer token
	 * @return authenticated admin identity when the token is active
	 */
	Optional<AdminUserDto> validateToken(@Nullable String token);

	/**
	 * Revokes an active bearer token.
	 *
	 * @param token token to revoke
	 */
	void revokeToken(@Nullable String token);

	/**
	 * Removes expired sessions from the in-memory session store.
	 */
	void purgeExpiredSessions();
}
