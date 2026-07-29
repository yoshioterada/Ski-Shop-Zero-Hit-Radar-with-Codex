package com.skishop.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ZeroHitKeywordLogFieldsTests {

	@Test
	void logFieldsExposeOnlyHashPrefixAndLength() {
		String normalizedKeyword = "powder finder xl";

		ZeroHitKeywordLogFields fields = ZeroHitKeywordLogFields.fromNormalizedKeyword(normalizedKeyword);

		assertThat(fields.hashPrefix()).hasSize(12);
		assertThat(fields.hashPrefix()).doesNotContain(normalizedKeyword);
		assertThat(fields.length()).isEqualTo(normalizedKeyword.length());
	}
}
