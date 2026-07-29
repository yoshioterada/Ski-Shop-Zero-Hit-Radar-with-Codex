package com.skishop.config;

import com.skishop.exception.ApiErrorWriter;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Central Spring Security policy for public health/product APIs and protected future admin APIs.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private static final Logger LOGGER = LoggerFactory.getLogger(SecurityConfig.class);

	private final CorsProperties corsProperties;
	private final ApiErrorWriter apiErrorWriter;
	private final BearerTokenAuthenticationFilter bearerTokenAuthenticationFilter;

	public SecurityConfig(
			CorsProperties corsProperties,
			ApiErrorWriter apiErrorWriter,
			BearerTokenAuthenticationFilter bearerTokenAuthenticationFilter) {
		this.corsProperties = corsProperties;
		this.apiErrorWriter = apiErrorWriter;
		this.bearerTokenAuthenticationFilter = bearerTokenAuthenticationFilter;
	}

	/**
	 * Configures stateless JSON API security and frontend-friendly authentication errors.
	 *
	 * @param http Spring Security HTTP builder
	 * @return configured filter chain
	 * @throws Exception when Spring Security cannot build the chain
	 */
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				.csrf(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/products", "/api/products/search").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
						.requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.anyRequest().authenticated())
				.exceptionHandling(exceptions -> exceptions
						.authenticationEntryPoint((request, response, authException) -> {
								LOGGER.warn("auth_failure code=AUTHENTICATION_REQUIRED path={}", request.getRequestURI());
								apiErrorWriter.write(response, 401, "Unauthorized", "AUTHENTICATION_REQUIRED", request.getRequestURI());
						})
						.accessDeniedHandler((request, response, accessDeniedException) -> {
								LOGGER.warn("auth_failure code=ACCESS_DENIED path={}", request.getRequestURI());
								apiErrorWriter.write(response, 403, "Forbidden", "ACCESS_DENIED", request.getRequestURI());
						}))
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.addFilterBefore(bearerTokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.build();
	}

	/**
	 * Supports encoded admin passwords such as `{bcrypt}...` and `{noop}...` for local tests.
	 *
	 * @return delegating password encoder
	 */
	@Bean
	public static PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

	/**
	 * Provides CORS rules based on the `CORS_ALLOWED_ORIGINS` environment variable.
	 *
	 * @return CORS configuration source for all API paths
	 */
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(corsProperties.allowedOrigins());
		configuration.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		configuration.setExposedHeaders(List.of("Content-Type"));
		configuration.setAllowCredentials(false);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
