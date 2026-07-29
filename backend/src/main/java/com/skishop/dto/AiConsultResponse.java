package com.skishop.dto;

/**
 * AI consultation answer with the provider path used to produce it.
 */
public record AiConsultResponse(
		String answer,
		ProviderStatus providerStatus) {
}
