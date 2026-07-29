package com.skishop.config;

import com.skishop.dto.AdminUserDto;
import com.skishop.exception.ApiErrorWriter;
import com.skishop.service.AdminAuthUseCase;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Converts valid `Authorization: Bearer` tokens into Spring Security admin authentication.
 */
@Component
public class BearerTokenAuthenticationFilter extends OncePerRequestFilter {

	private static final Logger LOGGER = LoggerFactory.getLogger(BearerTokenAuthenticationFilter.class);
	private static final String BEARER_PREFIX = "Bearer ";

	private final AdminAuthUseCase adminAuthUseCase;
	private final ApiErrorWriter apiErrorWriter;

	public BearerTokenAuthenticationFilter(AdminAuthUseCase adminAuthUseCase, ApiErrorWriter apiErrorWriter) {
		this.adminAuthUseCase = adminAuthUseCase;
		this.apiErrorWriter = apiErrorWriter;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String authorization = request.getHeader("Authorization");
		if (authorization == null || authorization.isBlank()) {
			filterChain.doFilter(request, response);
			return;
		}
		if (!authorization.startsWith(BEARER_PREFIX)) {
			LOGGER.warn("auth_failure code=INVALID_TOKEN path={}", request.getRequestURI());
			apiErrorWriter.write(response, 401, "Unauthorized", "INVALID_TOKEN", request.getRequestURI());
			return;
		}

		String token = authorization.substring(BEARER_PREFIX.length()).trim();
		Optional<AdminUserDto> user = adminAuthUseCase.validateToken(token);
		if (user.isEmpty()) {
			LOGGER.warn("auth_failure code=INVALID_TOKEN path={}", request.getRequestURI());
			apiErrorWriter.write(response, 401, "Unauthorized", "INVALID_TOKEN", request.getRequestURI());
			return;
		}

		UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
				user.get(),
				token,
				List.of(new SimpleGrantedAuthority("ROLE_" + user.get().role())));
		SecurityContextHolder.getContext().setAuthentication(authentication);
		filterChain.doFilter(request, response);
	}
}
