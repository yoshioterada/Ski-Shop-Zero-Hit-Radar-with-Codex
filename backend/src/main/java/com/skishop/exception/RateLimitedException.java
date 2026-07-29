package com.skishop.exception;

/**
 * Raised when a client exceeds the configured authentication attempt policy.
 */
public class RateLimitedException extends RuntimeException {

	public RateLimitedException(String message) {
		super(message);
	}
}
