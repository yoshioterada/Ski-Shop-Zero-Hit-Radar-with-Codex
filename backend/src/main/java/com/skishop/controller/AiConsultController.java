package com.skishop.controller;

import com.skishop.dto.AiConsultRequest;
import com.skishop.dto.AiConsultResponse;
import com.skishop.service.AiConsultUseCase;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin API for AI-assisted Zero Hit Radar consultation.
 */
@RestController
public class AiConsultController {

	private final AiConsultUseCase aiConsultUseCase;

	public AiConsultController(AiConsultUseCase aiConsultUseCase) {
		this.aiConsultUseCase = aiConsultUseCase;
	}

	/**
	 * Returns business advice for a zero-hit keyword or related admin question.
	 *
	 * @param request validated consultation request
	 * @return consultation answer and provider status
	 */
	@PostMapping("/api/admin/ai-consult")
	public AiConsultResponse consult(@Valid @RequestBody AiConsultRequest request) {
		return aiConsultUseCase.consult(request);
	}
}
