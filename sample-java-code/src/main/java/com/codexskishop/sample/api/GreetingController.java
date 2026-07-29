package com.codexskishop.sample.api;

import com.codexskishop.sample.service.GreetingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Provides a tiny HTTP API for command and review checks.
 */
@Validated
@RestController
@RequestMapping("/api")
public class GreetingController {

  private final GreetingService greetingService;

  public GreetingController(GreetingService greetingService) {
    this.greetingService = greetingService;
  }

  /**
   * Returns a simple health response for smoke tests.
   *
   * @return current API health state
   */
  @GetMapping("/health")
  public HealthResponse health() {
    return new HealthResponse("UP");
  }

  /**
   * Builds a greeting from a validated query parameter.
   *
   * @param name person or system name to greet
   * @return greeting response
   */
  @GetMapping("/greetings")
  public GreetingResponse greetByQuery(
      @RequestParam @NotBlank @Size(max = 40) String name) {
    return greetingService.greet(name);
  }

  /**
   * Builds a greeting from a validated JSON request body.
   *
   * @param request greeting request
   * @return greeting response
   */
  @PostMapping("/greetings")
  public GreetingResponse greetByBody(@Valid @RequestBody GreetingRequest request) {
    return greetingService.greet(request.name());
  }
}
