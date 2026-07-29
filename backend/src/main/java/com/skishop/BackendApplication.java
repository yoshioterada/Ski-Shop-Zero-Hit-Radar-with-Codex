package com.skishop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Starts the Codex Ski Shop Zero Hit Radar backend service.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class BackendApplication {

	/**
	 * Boots the Spring application context.
	 *
	 * @param args command-line arguments supplied by the runtime
	 */
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
