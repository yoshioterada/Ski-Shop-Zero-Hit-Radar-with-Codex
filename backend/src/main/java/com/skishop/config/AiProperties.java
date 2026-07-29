package com.skishop.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * AI provider settings mirrored from the Spring AI environment mapping.
 *
 * @param apiKey provider API key; may be empty to enable later fallback behavior
 * @param model chat model name used when live AI is configured
 */
@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(String apiKey, String model) {
}
