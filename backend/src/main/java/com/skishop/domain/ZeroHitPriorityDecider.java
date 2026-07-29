package com.skishop.domain;

import com.skishop.entity.Priority;

import org.springframework.stereotype.Component;

/**
 * Assigns MVP demand priority from zero-hit search volume.
 */
@Component
public class ZeroHitPriorityDecider {

	/**
	 * Uses the backend design MVP thresholds: HIGH for 5+, MEDIUM for 2+, LOW otherwise.
	 *
	 * @param hitCount zero-hit search count
	 * @return demand priority
	 */
	public Priority decide(int hitCount) {
		if (hitCount >= 5) {
			return Priority.HIGH;
		}
		if (hitCount >= 2) {
			return Priority.MEDIUM;
		}
		return Priority.LOW;
	}
}
