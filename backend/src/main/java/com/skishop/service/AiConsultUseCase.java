package com.skishop.service;

import com.skishop.dto.AiConsultRequest;
import com.skishop.dto.AiConsultResponse;

/**
 * AI consultation use case exposed to admin API controllers.
 */
public interface AiConsultUseCase {

	/**
	 * Produces business advice for a zero-hit keyword or related admin question.
	 *
	 * @param request validated consultation request
	 * @return consultation answer and provider status
	 */
	AiConsultResponse consult(AiConsultRequest request);
}
