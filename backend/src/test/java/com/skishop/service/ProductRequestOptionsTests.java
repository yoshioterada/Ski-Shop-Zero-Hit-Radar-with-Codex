package com.skishop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

/**
 * Verifies frontend query parameter normalization for product APIs.
 */
class ProductRequestOptionsTests {

	@Test
	void toPageableUsesDefaultsAndAllowedSorts() {
		Pageable defaults = ProductRequestOptions.toPageable(null, null);
		assertThat(defaults.getPageSize()).isEqualTo(20);
		assertThat(defaults.getSort().toString()).contains("createdAt: DESC");

		assertThat(ProductRequestOptions.toPageable(5, " price,desc ").getSort().toString()).contains("price: DESC");
		assertThat(ProductRequestOptions.toPageable(5, "price,asc").getSort().toString()).contains("price: ASC");
		assertThat(ProductRequestOptions.toPageable(5, "createdAt,desc").getSort().toString()).contains("createdAt: DESC");
	}

	@Test
	void toPageableRejectsInvalidLimitAndSort() {
		assertThatThrownBy(() -> ProductRequestOptions.toPageable(0, null)).isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> ProductRequestOptions.toPageable(101, null)).isInstanceOf(IllegalArgumentException.class);
		assertThatThrownBy(() -> ProductRequestOptions.toPageable(5, "name,asc")).isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void normalizeCategoriesSupportsFrontendAliases() {
		assertThat(ProductRequestOptions.normalizeCategories(null)).isEmpty();
		assertThat(ProductRequestOptions.normalizeCategories("  ")).isEmpty();
		assertThat(ProductRequestOptions.normalizeCategories("all")).isEmpty();
		assertThat(ProductRequestOptions.normalizeCategories("BOOTS")).containsExactly("ski boots");
		assertThat(ProductRequestOptions.normalizeCategories("accessories"))
				.containsExactly("bindings", "helmets", "gloves", "wax", "tuning goods");
		assertThat(ProductRequestOptions.normalizeCategories("goggles")).isEqualTo(List.of("goggles"));
	}
}
