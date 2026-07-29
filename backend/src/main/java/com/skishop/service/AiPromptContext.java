package com.skishop.service;

import java.util.List;

/**
 * Lightweight catalog context included in AI consultation prompts.
 */
public record AiPromptContext(
		List<String> categories,
		List<String> manufacturers) {
}
