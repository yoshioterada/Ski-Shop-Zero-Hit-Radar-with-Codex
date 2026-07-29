package com.codexskishop.sample;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Starts the small Spring Boot application used for code review command checks.
 */
@SpringBootApplication
public class SampleJavaCodeApplication {

  /**
   * Bootstraps the application.
   *
   * @param args command-line arguments passed to Spring Boot
   */
  public static void main(String[] args) {
    SpringApplication.run(SampleJavaCodeApplication.class, args);
  }
}
