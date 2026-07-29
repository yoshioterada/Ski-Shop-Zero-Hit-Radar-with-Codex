package com.skishop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Read-only ski shop product seeded through Flyway and returned by public product APIs.
 */
@Entity
@Table(name = "products")
public class Product {

	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@Column(nullable = false, length = 100)
	private String manufacturer;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false, length = 80)
	private String category;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal price;

	@Enumerated(EnumType.STRING)
	@Column(name = "stock_status", nullable = false, length = 40)
	private StockStatus stockStatus;

	@Column(name = "image_url", columnDefinition = "text")
	private String imageUrl;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Product() {
	}

	/**
	 * Creates a product with the full persisted state. Used by tests and future admin tooling.
	 */
	public Product(
			UUID id,
			String manufacturer,
			String name,
			String category,
			String description,
			BigDecimal price,
			StockStatus stockStatus,
			String imageUrl,
			Instant createdAt,
			Instant updatedAt) {
		this.id = Objects.requireNonNull(id);
		this.manufacturer = Objects.requireNonNull(manufacturer);
		this.name = Objects.requireNonNull(name);
		this.category = Objects.requireNonNull(category);
		this.description = Objects.requireNonNull(description);
		this.price = Objects.requireNonNull(price);
		this.stockStatus = Objects.requireNonNull(stockStatus);
		this.imageUrl = imageUrl;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	@PrePersist
	void prePersist() {
		Instant now = Instant.now();
		if (id == null) {
			id = UUID.randomUUID();
		}
		if (createdAt == null) {
			createdAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getManufacturer() {
		return manufacturer;
	}

	public String getName() {
		return name;
	}

	public String getCategory() {
		return category;
	}

	public String getDescription() {
		return description;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public StockStatus getStockStatus() {
		return stockStatus;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
