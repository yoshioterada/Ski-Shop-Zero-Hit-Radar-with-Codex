package com.skishop.service;

import org.springframework.lang.Nullable;

/**
 * Tracks admin login failures and lockout state.
 */
public interface LoginAttemptLimiter {

	/**
	 * Returns whether a login attempt is currently allowed for the username and source IP.
	 *
	 * @param username submitted username
	 * @param sourceIp client source IP
	 * @return true when the login attempt can proceed
	 */
	boolean isAllowed(@Nullable String username, @Nullable String sourceIp);

	/**
	 * Records a failed login attempt.
	 *
	 * @param username submitted username
	 * @param sourceIp client source IP
	 */
	void recordFailure(@Nullable String username, @Nullable String sourceIp);

	/**
	 * Clears accumulated failures after a successful login.
	 *
	 * @param username submitted username
	 * @param sourceIp client source IP
	 */
	void recordSuccess(@Nullable String username, @Nullable String sourceIp);
}
