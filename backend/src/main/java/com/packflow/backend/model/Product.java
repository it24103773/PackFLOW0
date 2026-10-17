package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "products")
public class Product implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String sku;
    private String packagingType;
    private String dimensions; // e.g. "300 x 200 x 150 mm"
    private String material;   // e.g. "Corrugated Kraft E-Flute"
    private String status;     // "Active", "Draft", "Archived"
    private String createdAt;

    public Product() {}

    public Product(Long id, String name, String sku, String packagingType, String dimensions, String material, String status, String createdAt) {
        this.id = id;
        this.name = name;
        this.sku = sku;
        this.packagingType = packagingType;
        this.dimensions = dimensions;
        this.material = material;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getPackagingType() { return packagingType; }
    public void setPackagingType(String packagingType) { this.packagingType = packagingType; }

    public String getDimensions() { return dimensions; }
    public void setDimensions(String dimensions) { this.dimensions = dimensions; }

    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
