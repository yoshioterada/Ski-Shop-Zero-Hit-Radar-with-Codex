package com.skishop.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.skishop.dto.AiConsultRequest;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * Verifies the Japanese business prompt contract for AI consultations.
 */
class AiPromptBuilderTests {

	private final AiPromptBuilder aiPromptBuilder = new AiPromptBuilder();

	@Test
	void promptIncludesDemandSignalsCatalogContextAndRequiredAdviceTopics() {
		String prompt = aiPromptBuilder.build(
				new AiConsultRequest("Powder Finder", "仕入れるべきですか?", 6, Instant.parse("2026-02-01T10:15:30Z")),
				new AiPromptContext(
						List.of("skis", "ski boots", "bindings"),
						List.of("Atomic", "Salomon", "Rossignol")));

		assertThat(prompt)
				.contains("keyword: Powder Finder")
				.contains("hit count: 6")
				.contains("last searched time: 2026-02-01T10:15:30Z")
				.contains("- skis")
				.contains("- ski boots")
				.contains("- Atomic")
				.contains("- Salomon")
				.contains("需要可能性")
				.contains("候補ブランドまたは商品タイプ")
				.contains("在庫検討の要否")
				.contains("調達リスク")
				.contains("季節性")
				.contains("代替商品または関連商品")
				.contains("次アクション")
				.contains("結論")
				.contains("理由")
				.contains("仕入れ候補")
				.contains("注意点")
				.contains("次のアクション");
	}

	@Test
	void promptUsesUnknownAndFallbackListTextForMissingOptionalSignals() {
		String prompt = aiPromptBuilder.build(
				new AiConsultRequest("   ", "  商品説明を改善すべきですか?  ", null, null),
				new AiPromptContext(
						Arrays.asList(null, " ", "skis", "skis", "helmets"),
						List.of()));

		assertThat(prompt)
				.contains("keyword: 不明")
				.contains("hit count: 不明")
				.contains("last searched time: 不明")
				.contains("- skis")
				.contains("- helmets")
				.contains("- なし")
				.contains("商品説明を改善すべきですか?");
	}

	@Test
	void promptUsesFallbackListTextForNullContextLists() {
		String prompt = aiPromptBuilder.build(
				new AiConsultRequest(null, "仕入れ判断をしてください", null, null),
				new AiPromptContext(null, null));

		assertThat(prompt)
				.contains("keyword: 不明")
				.contains("- なし");
	}
}
