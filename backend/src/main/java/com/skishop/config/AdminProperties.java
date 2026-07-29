package com.skishop.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Externalized administrator credential settings read from environment variables.
 *
 * @param username configured admin username; empty means login is not ready yet
 * @param password configured encoded admin password; never logged or exposed by API responses
 * @param tokenTtl opaque bearer token time-to-live
 */
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(String username, String password, Duration tokenTtl) {
}
