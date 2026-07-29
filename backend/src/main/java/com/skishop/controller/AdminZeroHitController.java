package com.skishop.controller;

import com.skishop.dto.ZeroHitListResponse;
import com.skishop.service.ZeroHitQueryUseCase;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

import org.springframework.lang.Nullable;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin API for reading Zero Hit Radar demand signals.
 */
@RestController
@Validated
public class AdminZeroHitController {

	private final ZeroHitQueryUseCase zeroHitQueryUseCase;

	public AdminZeroHitController(ZeroHitQueryUseCase zeroHitQueryUseCase) {
		this.zeroHitQueryUseCase = zeroHitQueryUseCase;
	}

	/**
	 * Lists zero-hit keywords and summary metrics for the requested recent period.
	 *
	 * @param days recent period in days
	 * @param sort allowed sort token
	 * @param limit maximum returned row count
	 * @return admin radar response
	 */
	@GetMapping("/api/admin/zero-hits")
	public ZeroHitListResponse listZeroHits(
			@RequestParam(required = false) @Nullable @Min(1) @Max(365) Integer days,
			@RequestParam(required = false) @Nullable @Pattern(regexp = "hitCount,desc|lastSearchedAt,desc") String sort,
			@RequestParam(required = false) @Nullable @Min(1) @Max(100) Integer limit) {
		return zeroHitQueryUseCase.listZeroHits(days, sort, limit);
	}
}
