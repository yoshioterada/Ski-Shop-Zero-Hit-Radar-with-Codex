package com.skishop.service;

import java.util.Optional;

/**
 * Boundary for generating text through Spring AI or a test double.
 */
public interface AiProviderClient {

	/**
	 * Generates an answer from the supplied prompt when a live provider is configured.
	 *
	 * @param prompt business consultation prompt
	 * @return generated answer, or empty when live AI is not configured
	 */
	Optional<String> generate(String prompt);
}
