package com.codexskishop.sample.api;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.codexskishop.sample.service.GreetingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GreetingController.class)
@Import({GreetingService.class, GlobalExceptionHandler.class})
class GreetingControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void healthReturnsUp() throws Exception {
    mockMvc.perform(get("/api/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
  }

  @Test
  void greetByQueryReturnsGreeting() throws Exception {
    mockMvc.perform(get("/api/greetings").param("name", "Radar"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Hello, Radar!"));
  }

  @Test
  void greetByBodyReturnsGreeting() throws Exception {
    mockMvc.perform(post("/api/greetings")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"Zero Hit"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Hello, Zero Hit!"));
  }

  @Test
  void greetByQueryRejectsBlankName() throws Exception {
    mockMvc.perform(get("/api/greetings").param("name", " "))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Request validation failed."))
        .andExpect(jsonPath("$.occurredAt").value(startsWith("20")));
  }

  @Test
  void greetByBodyRejectsBlankName() throws Exception {
    mockMvc.perform(post("/api/greetings")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":" "}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Request validation failed."))
        .andExpect(jsonPath("$.occurredAt").value(startsWith("20")));
  }
}
