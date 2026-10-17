package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "third_party_products")
public class ThirdPartyProduct implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String productName;
    private String sku;
    private String thirdPartySku;
    private String supplierName;
    private Long supplierId;
    private String category;
    private String dimensions;
    private String material;
    private Double unitPrice;
    private Integer moq;
    private Integer leadTimeDays;
    private String complianceStatus; // e.g. "ISO Certified", "FSC Certified", "FDA Approved", "Pending Audit"
    private String status;           // "Active", "Inactive", "Under Review"
    @Column(columnDefinition = "TEXT")
    private String notes;
    private String createdAt;

    public ThirdPartyProduct() {}

    public ThirdPartyProduct(Long id, String productName, String sku, String thirdPartySku, String supplierName, Long supplierId, String category, String dimensions, String material, Double unitPrice, Integer moq, Integer leadTimeDays, String complianceStatus, String status, String notes, String createdAt) {
        this.id = id;
        this.productName = productName;
        this.sku = sku;
        this.thirdPartySku = thirdPartySku;
        this.supplierName = supplierName;
        this.supplierId = supplierId;
        this.category = category;
        this.dimensions = dimensions;
        this.material = material;
        this.unitPrice = unitPrice;
        this.moq = moq;
        this.leadTimeDays = leadTimeDays;
        this.complianceStatus = complianceStatus;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getThirdPartySku() { return thirdPartySku; }
    public void setThirdPartySku(String thirdPartySku) { this.thirdPartySku = thirdPartySku; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDimensions() { return dimensions; }
    public void setDimensions(String dimensions) { this.dimensions = dimensions; }

    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Integer getMoq() { return moq; }
    public void setMoq(Integer moq) { this.moq = moq; }

    public Integer getLeadTimeDays() { return leadTimeDays; }
    public void setLeadTimeDays(Integer leadTimeDays) { this.leadTimeDays = leadTimeDays; }

    public String getComplianceStatus() { return complianceStatus; }
    public void setComplianceStatus(String complianceStatus) { this.complianceStatus = complianceStatus; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
