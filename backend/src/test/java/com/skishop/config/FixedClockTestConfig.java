package com.skishop.config;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Fixed test clock for deterministic time assertions.
 */
@TestConfiguration
public class FixedClockTestConfig {

	@Bean
	@Primary
	Clock fixedClock() {
		return Clock.fixed(Instant.parse("2026-02-01T10:15:30Z"), ZoneOffset.UTC);
	}
}
