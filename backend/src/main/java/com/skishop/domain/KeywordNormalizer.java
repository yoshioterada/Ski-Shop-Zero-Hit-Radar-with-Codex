package com.skishop.domain;

import java.util.Locale;

import org.springframework.stereotype.Component;

/**
 * Normalizes user search keywords so repeated zero-hit demand aggregates into one row.
 */
@Component
public class KeywordNormalizer {

	/**
	 * Trims, lowercases, and collapses repeated whitespace.
	 *
	 * @param keyword raw user keyword
	 * @return normalized keyword, or an empty string when input is null or blank
	 */
	public String normalize(String keyword) {
		if (keyword == null) {
			return "";
		}
		return keyword.trim()
				.toLowerCase(Locale.ROOT)
				.replaceAll("\\s+", " ");
	}
}
