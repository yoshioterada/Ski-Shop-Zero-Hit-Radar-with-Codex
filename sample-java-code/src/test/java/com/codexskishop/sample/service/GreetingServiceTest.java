package com.codexskishop.sample.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class GreetingServiceTest {

  private final GreetingService greetingService = new GreetingService();

  @Test
  void greetNormalizesRepeatedWhitespace() {
    assertThat(greetingService.greet("  Zero   Hit Radar  ").message())
        .isEqualTo("Hello, Zero Hit Radar!");
  }

  @Test
  void greetRejectsBlankName() {
    assertThatThrownBy(() -> greetingService.greet("   "))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("name must not be blank");
  }

  @Test
  void greetRejectsNullName() {
    assertThatThrownBy(() -> greetingService.greet(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("name must not be blank");
  }
}
