package com.skishop.service;

import com.skishop.dto.AiConsultRequest;
import com.skishop.dto.AiConsultResponse;
import com.skishop.dto.ProviderStatus;
import com.skishop.repository.ProductRepository;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates prompt construction, product context lookup, live AI generation, and fallback answers.
 */
@Service
public class AiConsultationService implements AiConsultUseCase {

	private static final Logger LOGGER = LoggerFactory.getLogger(AiConsultationService.class);

	private final ProductRepository productRepository;
	private final AiPromptBuilder aiPromptBuilder;
	private final AiProviderClient aiProviderClient;

	public AiConsultationService(
			ProductRepository productRepository,
			AiPromptBuilder aiPromptBuilder,
			AiProviderClient aiProviderClient) {
		this.productRepository = productRepository;
		this.aiPromptBuilder = aiPromptBuilder;
		this.aiProviderClient = aiProviderClient;
	}

	/**
	 * Produces administrator-facing business advice without exposing prompts, tokens, or secrets in the response.
	 *
	 * @param request consultation request
	 * @return AI-backed, fallback, or controlled error answer
	 */
	@Transactional(readOnly = true)
	@Override
	public AiConsultResponse consult(AiConsultRequest request) {
		AiPromptContext context = new AiPromptContext(
				productRepository.findDistinctCategories(),
				productRepository.findDistinctManufacturers());
		String prompt = aiPromptBuilder.build(request, context);

		try {
			Optional<String> generated = aiProviderClient.generate(prompt);
			AiConsultResponse response = generated
					.map(answer -> new AiConsultResponse(answer, ProviderStatus.LIVE))
					.orElseGet(() -> new AiConsultResponse(fallbackAnswer(request, context), ProviderStatus.FALLBACK));
			LOGGER.info("ai_consultation providerStatus={}", response.providerStatus());
			return response;
		} catch (AiProviderException exception) {
			AiConsultResponse response = new AiConsultResponse(providerErrorAnswer(request, context), ProviderStatus.ERROR);
			LOGGER.warn("ai_consultation providerStatus={}", response.providerStatus());
			return response;
		}
	}

	private String fallbackAnswer(AiConsultRequest request, AiPromptContext context) {
		return """
				結論
				AI_API_KEY が未設定のためデモ用の回答です。検索語「%s」は、既存カテゴリと照らして小さく検証する価値があります。

				理由
				Zero Hit は商品が見つからなかった需要の兆候です。hit count が %s のため、まずは問い合わせ数、季節、既存カテゴリとの近さを確認してください。

				仕入れ候補
				既存カテゴリでは %s を起点に、関連するブランドやサイズ展開を少量から検討してください。

				注意点
				調達リスク、シーズン終盤の在庫滞留、代替商品の有無を確認し、いきなり大量発注しないでください。

				次のアクション
				検索ログを 1 週間追跡し、同義語で商品名や説明文を改善したうえで、必要なら少量仕入れまたは予約受付を試してください。
				""".formatted(displayKeyword(request), displayHitCount(request), firstOrUnknown(context.categories()));
	}

	private String providerErrorAnswer(AiConsultRequest request, AiPromptContext context) {
		return """
				結論
				AI provider への接続で一時的な問題が発生しました。backend は継続稼働しているため、暫定判断として検索語「%s」を保留リストに入れてください。

				理由
				Zero Hit の hit count は %s です。ライブ回答が復旧するまで、既存カテゴリ「%s」と関連する商品で代替可能かを確認します。

				仕入れ候補
				関連カテゴリの商品説明を見直し、近いメーカーや商品タイプを候補として棚卸ししてください。

				注意点
				外部 AI の失敗を仕入れ判断の停止理由にせず、調達リスクと季節性を人手で確認してください。

				次のアクション
				AI 設定と provider 状態を確認し、復旧後に同じ質問を再実行してください。
				""".formatted(displayKeyword(request), displayHitCount(request), firstOrUnknown(context.categories()));
	}

	private String displayKeyword(AiConsultRequest request) {
		return request.keyword() == null || request.keyword().isBlank() ? "不明" : request.keyword().trim();
	}

	private String displayHitCount(AiConsultRequest request) {
		return request.hitCount() == null ? "不明" : request.hitCount().toString();
	}

	private String firstOrUnknown(java.util.List<String> values) {
		return values == null || values.isEmpty() ? "不明" : values.getFirst();
	}
}
