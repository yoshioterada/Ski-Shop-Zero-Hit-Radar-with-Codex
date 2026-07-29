package com.skishop.repository;

import com.skishop.entity.Product;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Product read repository for initial listings, search, and AI context lookups.
 */
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

	/**
	 * Fetches initial product rows with optional category filtering.
	 */
	@Query("""
			select p
			from Product p
			where (:category is null or p.category = :category)
			order by p.createdAt desc, p.name asc
			""")
	List<Product> findInitialProducts(@Param("category") String category, Pageable pageable);

	/**
	 * Searches manufacturer, name, category, and description using a lower-case contains match.
	 */
	@Query("""
			select p
			from Product p
			where (:category is null or p.category = :category)
			  and (
			    lower(p.manufacturer) like concat('%', :keyword, '%')
			    or lower(p.name) like concat('%', :keyword, '%')
			    or lower(p.category) like concat('%', :keyword, '%')
			    or lower(p.description) like concat('%', :keyword, '%')
			  )
			order by p.createdAt desc, p.name asc
			""")
	List<Product> searchProducts(
			@Param("keyword") String keyword,
			@Param("category") String category,
			Pageable pageable);

	/**
	 * Calculates the average product price used as opportunity-loss basis.
	 */
	@Query(value = "select coalesce(avg(price), 0) from products", nativeQuery = true)
	BigDecimal averagePrice();

	/**
	 * Lists distinct categories for filters and AI prompt context.
	 */
	@Query("select distinct p.category from Product p order by p.category")
	List<String> findDistinctCategories();

	/**
	 * Lists distinct manufacturers for AI prompt context.
	 */
	@Query("select distinct p.manufacturer from Product p order by p.manufacturer")
	List<String> findDistinctManufacturers();
}
