package com.skishop.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Converts framework and application exceptions into stable JSON responses for the frontend.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	/**
	 * Handles request body validation errors from Jakarta Bean Validation.
	 *
	 * @param exception validation exception
	 * @param request current request
	 * @return HTTP 400 with field-level errors
	 */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(
			MethodArgumentNotValidException exception,
			HttpServletRequest request) {
		Map<String, String> errors = new LinkedHashMap<>();
		for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
			errors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
		}
		return build(HttpStatus.BAD_REQUEST, "Invalid request", "VALIDATION_ERROR", request.getRequestURI(), errors);
	}

	/**
	 * Handles method parameter validation failures.
	 *
	 * @param exception method validation exception
	 * @param request current request
	 * @return HTTP 400 with a safe validation message
	 */
	@ExceptionHandler({HandlerMethodValidationException.class, ConstraintViolationException.class})
	public ResponseEntity<ApiErrorResponse> handleMethodValidation(
			Exception exception,
			HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, "Invalid request", "VALIDATION_ERROR", request.getRequestURI(), Map.of());
	}

	/**
	 * Handles invalid query parameter values such as unsupported sort tokens or non-numeric limits.
	 *
	 * @param exception invalid parameter exception
	 * @param request current request
	 * @return HTTP 400 response
	 */
	@ExceptionHandler({IllegalArgumentException.class, MethodArgumentTypeMismatchException.class})
	public ResponseEntity<ApiErrorResponse> handleInvalidParameter(Exception exception, HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, "Invalid request", "INVALID_PARAMETER", request.getRequestURI(), Map.of());
	}

	/**
	 * Handles invalid admin login attempts with a controlled 401 response.
	 *
	 * @param exception authentication failure
	 * @param request current request
	 * @return HTTP 401 response
	 */
	@ExceptionHandler(AuthenticationFailedException.class)
	public ResponseEntity<ApiErrorResponse> handleAuthenticationFailed(
			AuthenticationFailedException exception,
			HttpServletRequest request) {
		return build(HttpStatus.UNAUTHORIZED, "Unauthorized", "AUTHENTICATION_FAILED", request.getRequestURI(), Map.of());
	}

	/**
	 * Handles authentication rate limit lockouts with a safe fixed response.
	 *
	 * @param exception rate limit failure
	 * @param request current request
	 * @return HTTP 429 response
	 */
	@ExceptionHandler(RateLimitedException.class)
	public ResponseEntity<ApiErrorResponse> handleRateLimited(RateLimitedException exception, HttpServletRequest request) {
		return build(HttpStatus.TOO_MANY_REQUESTS, "Too many requests", "RATE_LIMITED", request.getRequestURI(), Map.of());
	}

	/**
	 * Handles missing API paths with a controlled 404 payload.
	 *
	 * @param exception missing resource exception
	 * @param request current request
	 * @return HTTP 404 response
	 */
	@ExceptionHandler(NoResourceFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleNotFound(NoResourceFoundException exception, HttpServletRequest request) {
		return build(HttpStatus.NOT_FOUND, "Resource not found", "NOT_FOUND", request.getRequestURI(), Map.of());
	}

	/**
	 * Handles unexpected failures without leaking stack traces, SQL, tokens, or secrets.
	 *
	 * @param exception unexpected exception
	 * @param request current request
	 * @return HTTP 500 response
	 */
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
		LOGGER.error("Unexpected API error at {} with type {}", request.getRequestURI(), exception.getClass().getName());
		return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "INTERNAL_ERROR", request.getRequestURI(), Map.of());
	}

	private ResponseEntity<ApiErrorResponse> build(
			HttpStatus status,
			String message,
			String code,
			String path,
			Map<String, String> errors) {
		ApiErrorResponse body = new ApiErrorResponse(Instant.now(), status.value(), message, code, path, errors);
		return ResponseEntity.status(status).body(body);
	}
}
