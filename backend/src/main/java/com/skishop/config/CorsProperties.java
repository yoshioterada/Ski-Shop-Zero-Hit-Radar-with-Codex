package com.skishop.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * CORS settings for browser-based frontend integration.
 *
 * @param allowedOrigins origins allowed to call the JSON API from a browser
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
