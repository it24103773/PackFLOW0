package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transactionCode;
    private Long itemId;
    private String itemName;
    private String category;
    private String transactionType; // STOCK_IN, STOCK_OUT, STOCK_ADJUSTMENT, PURCHASE_REORDER, MATERIAL_REGISTERED, SUPPLIER_ACCEPTED, MATERIAL_REMOVED, PRODUCTION_CONSUMPTION
    private Integer quantityChanged;
    private Integer previousStock;
    private Integer newStock;
    private String unit;
    private String performedBy;
    private String performedByEmail;
    private String timestamp;

    @Column(length = 1000)
    private String notes;

    public InventoryTransaction() {}

    public InventoryTransaction(Long id, String transactionCode, Long itemId, String itemName, String category,
                                String transactionType, Integer quantityChanged, Integer previousStock,
                                Integer newStock, String unit, String performedBy, String performedByEmail,
                                String timestamp, String notes) {
        this.id = id;
        this.transactionCode = transactionCode;
        this.itemId = itemId;
        this.itemName = itemName;
        this.category = category;
        this.transactionType = transactionType;
        this.quantityChanged = quantityChanged;
        this.previousStock = previousStock;
        this.newStock = newStock;
        this.unit = unit;
        this.performedBy = performedBy;
        this.performedByEmail = performedByEmail;
        this.timestamp = timestamp;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public Integer getQuantityChanged() {
        return quantityChanged;
    }

    public void setQuantityChanged(Integer quantityChanged) {
        this.quantityChanged = quantityChanged;
    }

    public Integer getPreviousStock() {
        return previousStock;
    }

    public void setPreviousStock(Integer previousStock) {
        this.previousStock = previousStock;
    }

    public Integer getNewStock() {
        return newStock;
    }

    public void setNewStock(Integer newStock) {
        this.newStock = newStock;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getPerformedByEmail() {
        return performedByEmail;
    }

    public void setPerformedByEmail(String performedByEmail) {
        this.performedByEmail = performedByEmail;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
