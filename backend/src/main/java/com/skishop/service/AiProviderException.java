package com.skishop.service;

/**
 * Controlled exception for failures inside the AI provider boundary.
 */
public class AiProviderException extends RuntimeException {

	public AiProviderException(String message, Throwable cause) {
		super(message, cause);
	}
}
