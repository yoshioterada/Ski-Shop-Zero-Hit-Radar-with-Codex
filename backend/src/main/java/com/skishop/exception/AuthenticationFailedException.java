package com.skishop.exception;

/**
 * Raised when admin credentials or bearer tokens are invalid.
 */
public class AuthenticationFailedException extends RuntimeException {

	public AuthenticationFailedException(String message) {
		super(message);
	}
}
