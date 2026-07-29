package com.codexskishop.sample.service;

import com.codexskishop.sample.api.GreetingResponse;
import org.springframework.stereotype.Service;

/**
 * Builds deterministic greetings for the sample API.
 */
@Service
public class GreetingService {

  /**
   * Creates a greeting after normalizing surrounding and repeated whitespace.
   *
   * @param name raw name supplied by the caller
   * @return greeting response with a normalized name
   * @throws IllegalArgumentException when the normalized name is blank
   */
  public GreetingResponse greet(String name) {
    String normalizedName = normalizeName(name);
    if (normalizedName.isBlank()) {
      throw new IllegalArgumentException("name must not be blank");
    }
    return new GreetingResponse("Hello, %s!".formatted(normalizedName));
  }

  private String normalizeName(String name) {
    if (name == null) {
      return "";
    }
    return name.trim().replaceAll("\\s+", " ");
  }
}
