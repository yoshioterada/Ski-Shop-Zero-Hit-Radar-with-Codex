package com.skishop.service;

import com.skishop.domain.KeywordNormalizer;
import com.skishop.domain.ZeroHitDemandPolicy;
import com.skishop.domain.ZeroHitDemandSignals;
import com.skishop.entity.ZeroHitSearch;
import com.skishop.repository.ProductRepository;
import com.skishop.repository.ZeroHitSearchRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Records valid zero-hit product searches as aggregated demand rows.
 */
@Service
public class ZeroHitRecordingService {

	private static final Logger LOGGER = LoggerFactory.getLogger(ZeroHitRecordingService.class);

	private final ZeroHitSearchRepository zeroHitSearchRepository;
	private final ProductRepository productRepository;
	private final KeywordNormalizer keywordNormalizer;
	private final ZeroHitDemandPolicy zeroHitDemandPolicy;
	private final ZeroHitAtomicUpsertGateway zeroHitAtomicUpsertGateway;
	private final TransactionTemplate transactionTemplate;
	private final Clock clock;
	private final Object fallbackUpsertLock = new Object();

	public ZeroHitRecordingService(
			ZeroHitSearchRepository zeroHitSearchRepository,
			ProductRepository productRepository,
			KeywordNormalizer keywordNormalizer,
			ZeroHitDemandPolicy zeroHitDemandPolicy,
			ZeroHitAtomicUpsertGateway zeroHitAtomicUpsertGateway,
			TransactionTemplate transactionTemplate,
			Clock clock) {
		this.zeroHitSearchRepository = zeroHitSearchRepository;
		this.productRepository = productRepository;
		this.keywordNormalizer = keywordNormalizer;
		this.zeroHitDemandPolicy = zeroHitDemandPolicy;
		this.zeroHitAtomicUpsertGateway = zeroHitAtomicUpsertGateway;
		this.transactionTemplate = transactionTemplate;
		this.clock = clock;
	}

	/**
	 * Upserts a non-blank zero-hit keyword within a transaction.
	 *
	 * @param keyword raw user keyword
	 * @return persisted zero-hit aggregate
	 */
	public ZeroHitSearch record(String keyword) {
		String normalizedKeyword = keywordNormalizer.normalize(keyword);
		if (normalizedKeyword.isBlank()) {
			throw new IllegalArgumentException("keyword must not be blank");
		}
		String displayKeyword = keyword.trim();
		Instant now = Instant.now(clock);

		ZeroHitSearch saved = zeroHitAtomicUpsertGateway.supportsAtomicUpsert()
				? zeroHitAtomicUpsertGateway.upsert(displayKeyword, normalizedKeyword, now)
				: transactionTemplate.execute(status -> recordWithJpaFallback(
						displayKeyword,
						normalizedKeyword,
						productRepository.averagePrice(),
						now));
		if (saved == null) {
			throw new IllegalStateException("zero-hit record transaction did not return a row");
		}
		logRecorded(saved);
		return saved;
	}

	private ZeroHitSearch recordWithJpaFallback(
			String displayKeyword,
			String normalizedKeyword,
			BigDecimal averageProductPrice,
			Instant now) {
		synchronized (fallbackUpsertLock) {
			return zeroHitSearchRepository.findByNormalizedKeyword(normalizedKeyword)
					.map(existing -> updateExisting(existing, displayKeyword, averageProductPrice, now))
					.orElseGet(() -> insertFirst(displayKeyword, normalizedKeyword, averageProductPrice, now));
		}
	}

	private ZeroHitSearch updateExisting(
			ZeroHitSearch existing,
			String displayKeyword,
			BigDecimal averageProductPrice,
			Instant now) {
		int nextHitCount = existing.getHitCount() + 1;
		ZeroHitDemandSignals demandSignals = zeroHitDemandPolicy.calculate(nextHitCount, averageProductPrice);
		existing.recordRepeat(displayKeyword, demandSignals.estimatedOpportunityLoss(), now);
		return zeroHitSearchRepository.save(existing);
	}

	private ZeroHitSearch insertFirst(
			String displayKeyword,
			String normalizedKeyword,
			BigDecimal averageProductPrice,
			Instant now) {
		ZeroHitDemandSignals demandSignals = zeroHitDemandPolicy.calculate(1, averageProductPrice);
		ZeroHitSearch zeroHitSearch = ZeroHitSearch.firstHit(
				displayKeyword,
				normalizedKeyword,
				demandSignals.estimatedOpportunityLoss(),
				now);
		return zeroHitSearchRepository.save(zeroHitSearch);
	}

	private void logRecorded(ZeroHitSearch saved) {
		ZeroHitKeywordLogFields logFields = ZeroHitKeywordLogFields.fromNormalizedKeyword(saved.getNormalizedKeyword());
		LOGGER.info(
				"zero_hit_recorded keywordHash={} keywordLength={} hitCount={} priority={}",
				logFields.hashPrefix(),
				logFields.length(),
				saved.getHitCount(),
				saved.getPriority());
	}
}
