package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "material_history")
public class SupplierMaterialHistory implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long supplierId;
    private String supplierName;
    private String materialName;
    private String category;
    private Integer quantity;
    private String unit;
    private Double unitPrice;
    private Double totalCost;
    private String supplyDate;
    private String batchNumber;
    private String qualityStatus;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public SupplierMaterialHistory() {}

    public SupplierMaterialHistory(Long id, Long supplierId, String supplierName, String materialName, String category, Integer quantity, String unit, Double unitPrice, Double totalCost, String supplyDate, String batchNumber, String qualityStatus, String notes) {
        this.id = id;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.materialName = materialName;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.unitPrice = unitPrice;
        this.totalCost = totalCost != null ? totalCost : (unitPrice != null && quantity != null ? unitPrice * quantity : 0.0);
        this.supplyDate = supplyDate;
        this.batchNumber = batchNumber;
        this.qualityStatus = qualityStatus;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }

    public String getSupplyDate() { return supplyDate; }
    public void setSupplyDate(String supplyDate) { this.supplyDate = supplyDate; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public String getQualityStatus() { return qualityStatus; }
    public void setQualityStatus(String qualityStatus) { this.qualityStatus = qualityStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
