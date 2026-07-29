package com.skishop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.skishop.config.AdminProperties;
import com.skishop.dto.LoginResponse;
import com.skishop.exception.AuthenticationFailedException;
import com.skishop.exception.RateLimitedException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Verifies opaque admin token issuing, validation, and failure branches.
 */
class AdminAuthServiceTests {

	private final PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
	private final Clock clock = Clock.fixed(Instant.parse("2026-02-01T10:15:30Z"), ZoneOffset.UTC);

	@Test
	void validLoginIssuesDistinctTokenAndValidatesAdminUser() {
		AdminAuthService service = service(new AdminProperties("admin@example.com", "{noop}secret", Duration.ofHours(1)));

		LoginResponse first = service.login("admin@example.com", "secret", "127.0.0.1");
		LoginResponse second = service.login("admin@example.com", "secret", "127.0.0.1");

		assertThat(first.isSuccess()).isTrue();
		assertThat(first.token()).isNotBlank().isNotEqualTo(second.token());
		assertThat(service.validateToken(first.token()))
				.isPresent()
				.get()
				.satisfies(user -> {
					assertThat(user.username()).isEqualTo("admin@example.com");
					assertThat(user.role()).isEqualTo("ADMIN");
				});
	}

	@Test
	void loginFailsWhenCredentialsAreMissingWrongOrUnconfigured() {
		AdminAuthService configured = service(new AdminProperties("admin@example.com", "{noop}secret", Duration.ofHours(1)));
		assertThatThrownBy(() -> configured.login(null, "secret", "127.0.0.1")).isInstanceOf(AuthenticationFailedException.class);
		assertThatThrownBy(() -> configured.login("admin@example.com", null, "127.0.0.1")).isInstanceOf(AuthenticationFailedException.class);
		assertThatThrownBy(() -> configured.login("wrong@example.com", "secret", "127.0.0.1"))
				.isInstanceOf(AuthenticationFailedException.class);
		assertThatThrownBy(() -> configured.login("admin@example.com", "wrong", "127.0.0.2"))
				.isInstanceOf(AuthenticationFailedException.class);

		assertThatThrownBy(() -> service(new AdminProperties("", "{noop}secret", Duration.ofHours(1)))
				.login("admin@example.com", "secret", "127.0.0.1")).isInstanceOf(AuthenticationFailedException.class);
		assertThatThrownBy(() -> service(new AdminProperties("admin@example.com", "", Duration.ofHours(1)))
				.login("admin@example.com", "secret", "127.0.0.1")).isInstanceOf(AuthenticationFailedException.class);
	}

	@Test
	void validateTokenRejectsBlankUnknownAndExpiredTokens() {
		AdminAuthService expiringService = service(new AdminProperties("admin@example.com", "{noop}secret", Duration.ZERO));
		String expiredToken = expiringService.login("admin@example.com", "secret", "127.0.0.1").token();

		assertThat(expiringService.validateToken(null)).isEmpty();
		assertThat(expiringService.validateToken("   ")).isEmpty();
		assertThat(expiringService.validateToken("unknown-token")).isEmpty();
		assertThat(expiringService.validateToken(expiredToken)).isEmpty();
		assertThat(expiringService.validateToken(expiredToken)).isEmpty();
	}

	@Test
	void nullTokenTtlFallsBackToEightHours() {
		AdminAuthService service = service(new AdminProperties("admin@example.com", "{noop}secret", null));
		String token = service.login("admin@example.com", "secret", "127.0.0.1").token();

		assertThat(service.validateToken(token)).isPresent();
	}

	@Test
	void repeatedFailuresLockSameUsernameAndSourceIp() {
		AdminAuthService service = service(new AdminProperties("admin@example.com", "{noop}secret", Duration.ofHours(1)));
		for (int i = 0; i < 5; i++) {
			assertThatThrownBy(() -> service.login("admin@example.com", "wrong", "203.0.113.10"))
					.isInstanceOf(AuthenticationFailedException.class);
		}

		assertThatThrownBy(() -> service.login("admin@example.com", "secret", "203.0.113.10"))
				.isInstanceOf(RateLimitedException.class);
		assertThat(service.login("admin@example.com", "secret", "203.0.113.11").token()).isNotBlank();
	}

	@Test
	void revokeAndActiveTokenCapInvalidateTokens() {
		AdminAuthService service = service(new AdminProperties("admin@example.com", "{noop}secret", Duration.ofHours(1)));
		String first = service.login("admin@example.com", "secret", "127.0.0.1").token();
		String second = service.login("admin@example.com", "secret", "127.0.0.1").token();
		String third = service.login("admin@example.com", "secret", "127.0.0.1").token();
		String fourth = service.login("admin@example.com", "secret", "127.0.0.1").token();

		assertThat(service.validateToken(first)).isEmpty();
		assertThat(service.validateToken(second)).isPresent();
		assertThat(service.validateToken(third)).isPresent();
		assertThat(service.validateToken(fourth)).isPresent();

		service.revokeToken(second);
		assertThat(service.validateToken(second)).isEmpty();
	}

	private AdminAuthService service(AdminProperties properties) {
		return new AdminAuthService(properties, passwordEncoder, clock, new InMemoryLoginAttemptLimiter(clock));
	}
}
