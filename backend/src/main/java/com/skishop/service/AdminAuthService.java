package com.skishop.service;

import com.skishop.config.AdminProperties;
import com.skishop.dto.AdminUserDto;
import com.skishop.dto.LoginResponse;
import com.skishop.exception.AuthenticationFailedException;
import com.skishop.exception.RateLimitedException;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

/**
 * Authenticates the single MVP admin account and manages opaque bearer sessions.
 * Opaque in-memory tokens keep the OSS demo free of token signing secrets while
 * still allowing explicit expiry and Spring Security authorization.
 */
@Service
public class AdminAuthService implements AdminAuthUseCase {

	private static final String ADMIN_ROLE = "ADMIN";
	private static final int TOKEN_BYTES = 32;
	private static final int MAX_ACTIVE_TOKENS_PER_ADMIN = 3;

	private final AdminProperties adminProperties;
	private final PasswordEncoder passwordEncoder;
	private final Clock clock;
	private final LoginAttemptLimiter loginAttemptLimiter;
	private final SecureRandom secureRandom = new SecureRandom();
	private final Map<String, AdminSession> sessions = new ConcurrentHashMap<>();
	private final AtomicLong sessionSequence = new AtomicLong();

	public AdminAuthService(
			AdminProperties adminProperties,
			PasswordEncoder passwordEncoder,
			Clock clock,
			LoginAttemptLimiter loginAttemptLimiter) {
		this.adminProperties = adminProperties;
		this.passwordEncoder = passwordEncoder;
		this.clock = clock;
		this.loginAttemptLimiter = loginAttemptLimiter;
	}

	/**
	 * Validates configured admin credentials and issues a time-limited opaque token.
	 *
	 * @param username submitted username
	 * @param password submitted password
	 * @return successful login response
	 */
	@Override
	public LoginResponse login(@Nullable String username, @Nullable String password, @Nullable String sourceIp) {
		if (!loginAttemptLimiter.isAllowed(username, sourceIp)) {
			throw new RateLimitedException("Too many login attempts");
		}
		if (!isConfigured()
				|| username == null
				|| password == null
				|| !adminProperties.username().equals(username)
				|| !passwordEncoder.matches(password, adminProperties.password())) {
			loginAttemptLimiter.recordFailure(username, sourceIp);
			throw new AuthenticationFailedException("Invalid admin credentials");
		}

		loginAttemptLimiter.recordSuccess(username, sourceIp);
		purgeExpiredSessions();
		AdminUserDto user = new AdminUserDto(adminProperties.username(), ADMIN_ROLE);
		String token = issueToken(user);
		return new LoginResponse(true, token, user);
	}

	/**
	 * Validates a bearer token and returns the associated admin identity when active.
	 *
	 * @param token opaque bearer token
	 * @return admin identity if token exists and has not expired
	 */
	@Override
	public Optional<AdminUserDto> validateToken(@Nullable String token) {
		if (token == null || token.isBlank()) {
			return Optional.empty();
		}
		AdminSession session = sessions.get(token);
		if (session == null) {
			return Optional.empty();
		}
		if (!session.expiresAt().isAfter(Instant.now(clock))) {
			sessions.remove(token);
			return Optional.empty();
		}
		return Optional.of(session.user());
	}

	@Override
	public void revokeToken(@Nullable String token) {
		if (token != null && !token.isBlank()) {
			sessions.remove(token);
		}
	}

	@Override
	public void purgeExpiredSessions() {
		Instant now = Instant.now(clock);
		sessions.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
	}

	private boolean isConfigured() {
		return adminProperties.username() != null
				&& !adminProperties.username().isBlank()
				&& adminProperties.password() != null
				&& !adminProperties.password().isBlank();
	}

	private String issueToken(AdminUserDto user) {
		enforceActiveTokenLimit(user);
		byte[] bytes = new byte[TOKEN_BYTES];
		secureRandom.nextBytes(bytes);
		String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		Duration ttl = adminProperties.tokenTtl() == null ? Duration.ofHours(8) : adminProperties.tokenTtl();
		Instant issuedAt = Instant.now(clock);
		sessions.put(token, new AdminSession(user, sessionSequence.incrementAndGet(), issuedAt, issuedAt.plus(ttl)));
		return token;
	}

	private void enforceActiveTokenLimit(AdminUserDto user) {
		long activeTokenCount = sessions.values().stream()
				.filter(session -> session.user().username().equals(user.username()))
				.count();
		if (activeTokenCount < MAX_ACTIVE_TOKENS_PER_ADMIN) {
			return;
		}
		sessions.entrySet().stream()
				.filter(entry -> entry.getValue().user().username().equals(user.username()))
				.min(Comparator.comparing(entry -> entry.getValue().sequence()))
				.ifPresent(entry -> sessions.remove(entry.getKey()));
	}

	private record AdminSession(AdminUserDto user, long sequence, Instant issuedAt, Instant expiresAt) {
	}
}
