package com.skishop.service;

import com.skishop.dto.ZeroHitListResponse;

import org.springframework.lang.Nullable;

/**
 * Zero-hit radar query use case exposed to admin API controllers.
 */
public interface ZeroHitQueryUseCase {

	/**
	 * Lists zero-hit demand rows with optional period, sort, and limit controls.
	 *
	 * @param days optional recent period in days
	 * @param sort optional sort token
	 * @param limit optional maximum row count
	 * @return radar rows and summary metrics
	 */
	ZeroHitListResponse listZeroHits(@Nullable Integer days, @Nullable String sort, @Nullable Integer limit);
}
