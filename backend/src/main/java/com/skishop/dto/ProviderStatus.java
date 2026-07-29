package com.skishop.dto;

/**
 * Indicates whether the consultation came from live AI, fallback demo logic, or a controlled provider error path.
 */
public enum ProviderStatus {
	LIVE,
	FALLBACK,
	ERROR
}
