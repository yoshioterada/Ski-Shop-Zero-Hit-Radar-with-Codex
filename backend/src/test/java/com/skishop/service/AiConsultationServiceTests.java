package com.skishop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.skishop.dto.AiConsultRequest;
import com.skishop.dto.AiConsultResponse;
import com.skishop.dto.ProviderStatus;
import com.skishop.repository.ProductRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/**
 * Verifies AI consultation orchestration without calling external providers.
 */
class AiConsultationServiceTests {

	@Test
	void liveProviderAnswerReturnsLiveStatus() {
		ProductRepository productRepository = productRepository();
		AiProviderClient providerClient = prompt -> Optional.of("結論\nライブ回答です。");
		AiConsultationService service = new AiConsultationService(productRepository, new AiPromptBuilder(), providerClient);

		AiConsultResponse response = service.consult(request());

		assertThat(response.providerStatus()).isEqualTo(ProviderStatus.LIVE);
		assertThat(response.answer()).contains("ライブ回答");
	}

	@Test
	void missingProviderReturnsUsefulFallbackAnswer() {
		ProductRepository productRepository = productRepository();
		AiProviderClient providerClient = prompt -> Optional.empty();
		AiConsultationService service = new AiConsultationService(productRepository, new AiPromptBuilder(), providerClient);

		AiConsultResponse response = service.consult(request());

		assertThat(response.providerStatus()).isEqualTo(ProviderStatus.FALLBACK);
		assertThat(response.answer())
				.contains("結論")
				.contains("AI_API_KEY が未設定")
				.contains("仕入れ候補")
				.contains("次のアクション")
				.doesNotContain("Bearer")
				.doesNotContain("test-password");
	}

	@Test
	void providerErrorReturnsControlledErrorAnswerWithoutThrowing() {
		ProductRepository productRepository = productRepository();
		AiProviderClient providerClient = prompt -> {
			throw new AiProviderException("boom", new RuntimeException("provider failed"));
		};
		AiConsultationService service = new AiConsultationService(productRepository, new AiPromptBuilder(), providerClient);

		AiConsultResponse response = service.consult(request());

		assertThat(response.providerStatus()).isEqualTo(ProviderStatus.ERROR);
		assertThat(response.answer())
				.contains("AI provider への接続で一時的な問題")
				.contains("次のアクション")
				.doesNotContain("provider failed");
	}

	private ProductRepository productRepository() {
		ProductRepository productRepository = Mockito.mock(ProductRepository.class);
		when(productRepository.findDistinctCategories()).thenReturn(List.of("skis", "ski boots"));
		when(productRepository.findDistinctManufacturers()).thenReturn(List.of("Atomic", "Salomon"));
		return productRepository;
	}

	private AiConsultRequest request() {
		return new AiConsultRequest(
				"Powder Finder",
				"今季に仕入れるべきか判断してください",
				3,
				Instant.parse("2026-02-01T10:15:30Z"));
	}
}
