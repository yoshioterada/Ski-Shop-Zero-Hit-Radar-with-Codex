package com.skishop.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Logs request path, status, and duration without query strings, credentials, or bearer token values.
 */
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

	private static final Logger LOGGER = LoggerFactory.getLogger(RequestLoggingFilter.class);

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		Instant startedAt = Instant.now();
		try {
			filterChain.doFilter(request, response);
		}
		finally {
			long durationMillis = Duration.between(startedAt, Instant.now()).toMillis();
			LOGGER.info(
					"api_request method={} path={} status={} durationMs={}",
					request.getMethod(),
					request.getRequestURI(),
					response.getStatus(),
					durationMillis);
		}
	}
}
