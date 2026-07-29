package com.codexskishop.sample.api;

import java.time.Instant;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

/**
 * Converts validation failures into a consistent public error response.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * Handles invalid JSON request bodies.
   *
   * @param exception validation exception raised by Spring MVC
   * @return a sanitized validation error response
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleInvalidBody(MethodArgumentNotValidException exception) {
    return badRequest();
  }

  /**
   * Handles invalid method parameters such as query parameters.
   *
   * @param exception validation exception raised by Spring MVC
   * @return a sanitized validation error response
   */
  @ExceptionHandler(HandlerMethodValidationException.class)
  public ResponseEntity<ErrorResponse> handleInvalidParameter(HandlerMethodValidationException exception) {
    return badRequest();
  }

  /**
   * Handles method-level validation failures raised by AOP validation.
   *
   * @param exception constraint violation raised by Bean Validation
   * @return a sanitized validation error response
   */
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {
    return badRequest();
  }

  private ResponseEntity<ErrorResponse> badRequest() {
    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(new ErrorResponse("Request validation failed.", Instant.now()));
  }
}
