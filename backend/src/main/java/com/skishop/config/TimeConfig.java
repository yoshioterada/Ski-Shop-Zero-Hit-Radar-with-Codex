package com.skishop.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Time-related infrastructure beans.
 */
@Configuration
public class TimeConfig {

	/**
	 * Provides the application clock so time-dependent domain services are testable.
	 *
	 * @return system UTC clock
	 */
	@Bean
	public Clock clock() {
		return Clock.systemUTC();
	}
}
