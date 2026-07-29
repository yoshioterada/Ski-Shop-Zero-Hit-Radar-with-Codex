package com.skishop.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

/**
 * In-memory login limiter for the OSS demo backend.
 */
@Service
public class InMemoryLoginAttemptLimiter implements LoginAttemptLimiter {

	static final int FAILURE_THRESHOLD = 5;
	static final Duration WINDOW = Duration.ofMinutes(10);
	static final Duration LOCK_DURATION = Duration.ofMinutes(15);

	private final Clock clock;
	private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

	public InMemoryLoginAttemptLimiter(Clock clock) {
		this.clock = clock;
	}

	@Override
	public boolean isAllowed(@Nullable String username, @Nullable String sourceIp) {
		AttemptState state = attempts.get(key(username, sourceIp));
		return state == null || !state.isLocked(Instant.now(clock));
	}

	@Override
	public void recordFailure(@Nullable String username, @Nullable String sourceIp) {
		Instant now = Instant.now(clock);
		attempts.compute(key(username, sourceIp), (ignored, current) -> {
			if (current == null || current.windowStartedAt().plus(WINDOW).isBefore(now)) {
				return new AttemptState(1, now, null);
			}
			int failureCount = current.failureCount() + 1;
			Instant lockedUntil = failureCount >= FAILURE_THRESHOLD ? now.plus(LOCK_DURATION) : current.lockedUntil();
			return new AttemptState(failureCount, current.windowStartedAt(), lockedUntil);
		});
	}

	@Override
	public void recordSuccess(@Nullable String username, @Nullable String sourceIp) {
		attempts.remove(key(username, sourceIp));
	}

	private String key(@Nullable String username, @Nullable String sourceIp) {
		String normalizedUsername = username == null || username.isBlank()
				? "unknown"
				: username.trim().toLowerCase(Locale.ROOT);
		String normalizedSourceIp = sourceIp == null || sourceIp.isBlank() ? "unknown" : sourceIp.trim();
		return normalizedUsername + "|" + normalizedSourceIp;
	}

	private record AttemptState(int failureCount, Instant windowStartedAt, @Nullable Instant lockedUntil) {

		boolean isLocked(Instant now) {
			return lockedUntil != null && lockedUntil.isAfter(now);
		}
	}
}
