package com.skishop.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Log-safe representation of a user-controlled zero-hit keyword.
 */
record ZeroHitKeywordLogFields(String hashPrefix, int length) {

	private static final int HASH_PREFIX_LENGTH = 12;

	static ZeroHitKeywordLogFields fromNormalizedKeyword(String normalizedKeyword) {
		return new ZeroHitKeywordLogFields(hashPrefix(normalizedKeyword), normalizedKeyword.length());
	}

	private static String hashPrefix(String value) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
			StringBuilder hex = new StringBuilder(HASH_PREFIX_LENGTH);
			for (byte current : digest) {
				hex.append(String.format("%02x", current));
				if (hex.length() >= HASH_PREFIX_LENGTH) {
					return hex.substring(0, HASH_PREFIX_LENGTH);
				}
			}
			return hex.toString();
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is not available", ex);
		}
	}
}
