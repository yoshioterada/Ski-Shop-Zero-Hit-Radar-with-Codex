package com.skishop.service;

import com.skishop.dto.AiConsultRequest;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

/**
 * Builds Japanese business consultation prompts for ski shop administrators.
 */
@Component
public class AiPromptBuilder {

	/**
	 * Creates a prompt containing zero-hit demand signals and current catalog context.
	 *
	 * @param request admin consultation request
	 * @param context existing product categories and manufacturers
	 * @return Japanese prompt for business advice
	 */
	public String build(AiConsultRequest request, AiPromptContext context) {
		String keyword = blankToUnknown(request.keyword());
		String hitCount = request.hitCount() == null ? "不明" : request.hitCount().toString();
		String lastSearchedAt = request.lastSearchedAt() == null
				? "不明"
				: DateTimeFormatter.ISO_INSTANT.format(request.lastSearchedAt());

		return """
				あなたはスキーショップの仕入れ責任者を支援するビジネスアナリストです。
				Zero Hit Radar に記録された検索需要をもとに、日本語で実務的に助言してください。

				需要シグナル:
				- keyword: %s
				- hit count: %s
				- last searched time: %s

				既存の商品カテゴリ:
				%s

				既存メーカー:
				%s

				管理者の質問:
				%s

				次の観点を必ず含めてください:
				- 需要可能性
				- 候補ブランドまたは商品タイプ
				- 在庫検討の要否
				- 調達リスク
				- 季節性
				- 代替商品または関連商品
				- 次アクション

				回答は次の見出しで簡潔に整理してください:
				結論
				理由
				仕入れ候補
				注意点
				次のアクション
				""".formatted(
				keyword,
				hitCount,
				lastSearchedAt,
				formatList(context.categories()),
				formatList(context.manufacturers()),
				safeQuestion(request.question()));
	}

	private String blankToUnknown(String value) {
		return value == null || value.isBlank() ? "不明" : value.trim();
	}

	private String safeQuestion(String question) {
		return question == null ? "" : question.trim();
	}

	private String formatList(List<String> values) {
		if (values == null || values.isEmpty()) {
			return "- なし";
		}
		return values.stream()
				.filter(value -> value != null && !value.isBlank())
				.map(String::trim)
				.distinct()
				.limit(20)
				.map(value -> "- " + value)
				.toList()
				.stream()
				.reduce((left, right) -> left + System.lineSeparator() + right)
				.orElse("- なし");
	}
}
