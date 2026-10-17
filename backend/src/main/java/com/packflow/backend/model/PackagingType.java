package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "packaging_types")
public class PackagingType implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String typeName;
    @Column(columnDefinition = "TEXT")
    private String description;
    private Integer minWidthMm;
    private Integer maxWidthMm;
    private Integer minHeightMm;
    private Integer maxHeightMm;
    private Integer minDepthMm;
    private Integer maxDepthMm;
    private Double maxWeightCapacityKg;
    @Column(columnDefinition = "TEXT")
    private String supportedMaterials;
    private Double baseUnitPrice; // Base price per unit (LKR)
    private String status; // "Active", "Inactive"
    private String createdAt;

    public PackagingType() {}

    public PackagingType(Long id, String typeName, String description, Integer minWidthMm, Integer maxWidthMm, Integer minHeightMm, Integer maxHeightMm, Integer minDepthMm, Integer maxDepthMm, Double maxWeightCapacityKg, String supportedMaterials, Double baseUnitPrice, String status, String createdAt) {
        this.id = id;
        this.typeName = typeName;
        this.description = description;
        this.minWidthMm = minWidthMm;
        this.maxWidthMm = maxWidthMm;
        this.minHeightMm = minHeightMm;
        this.maxHeightMm = maxHeightMm;
        this.minDepthMm = minDepthMm;
        this.maxDepthMm = maxDepthMm;
        this.maxWeightCapacityKg = maxWeightCapacityKg;
        this.supportedMaterials = supportedMaterials;
        this.baseUnitPrice = baseUnitPrice;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getMinWidthMm() { return minWidthMm; }
    public void setMinWidthMm(Integer minWidthMm) { this.minWidthMm = minWidthMm; }

    public Integer getMaxWidthMm() { return maxWidthMm; }
    public void setMaxWidthMm(Integer maxWidthMm) { this.maxWidthMm = maxWidthMm; }

    public Integer getMinHeightMm() { return minHeightMm; }
    public void setMinHeightMm(Integer minHeightMm) { this.minHeightMm = minHeightMm; }

    public Integer getMaxHeightMm() { return maxHeightMm; }
    public void setMaxHeightMm(Integer maxHeightMm) { this.maxHeightMm = maxHeightMm; }

    public Integer getMinDepthMm() { return minDepthMm; }
    public void setMinDepthMm(Integer minDepthMm) { this.minDepthMm = minDepthMm; }

    public Integer getMaxDepthMm() { return maxDepthMm; }
    public void setMaxDepthMm(Integer maxDepthMm) { this.maxDepthMm = maxDepthMm; }

    public Double getMaxWeightCapacityKg() { return maxWeightCapacityKg; }
    public void setMaxWeightCapacityKg(Double maxWeightCapacityKg) { this.maxWeightCapacityKg = maxWeightCapacityKg; }

    public String getSupportedMaterials() { return supportedMaterials; }
    public void setSupportedMaterials(String supportedMaterials) { this.supportedMaterials = supportedMaterials; }

    public Double getBaseUnitPrice() { return baseUnitPrice; }
    public void setBaseUnitPrice(Double baseUnitPrice) { this.baseUnitPrice = baseUnitPrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
