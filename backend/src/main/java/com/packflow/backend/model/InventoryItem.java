package com.packflow.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "inventory_items")
@JsonIgnoreProperties(ignoreUnknown = true)
public class InventoryItem implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String category;         // Material Type e.g. "Cardboard & Paperboard", "Plastics & Films", "Bubble Wrap & Cushioning", "Tapes & Adhesives", "Glass & Containers", "Metal & Strapping", "Labels & Inks"
    private Integer stockLevel;      // Current Available Stock Quantity
    private Integer purchasedStock;  // Total Stock Quantity Bought from Suppliers
    private String unit;             // e.g. "Sheets", "Liters", "Rolls", "Kg", "Boxes", "Meters"
    private Integer reorderThreshold;
    private String supplierEmail;
    private String supplierName;
    private String status;           // "Available", "Low Stock", "Out of Stock", "On-Going", "Accepted"
    private String lastUpdated;
    private String supplierAcceptedAt;
    private Boolean acceptedNotificationRead;

    // Pricing Fields (Referenced from Previous Supplied Materials History)
    private Double unitPrice;
    private Double totalPrice;

    // Supplier Bank Details provided during order acceptance
    private String bankName;
    private String accountHolderName;
    private String accountNumber;
    private String branchName;
    private String swiftCode;
    private String bankNotes;

    // Visa Payment Tracking Fields
    private String paymentStatus;               // "Unpaid", "Pending Payment", "Paid"
    private String paidAt;
    private String paymentMethod;               // "Visa Card"
    private String paymentTransactionId;
    private String cardLastFour;
    private Boolean supplierPaymentNotificationRead;

    public InventoryItem() {}

    public InventoryItem(Long id, String name, String category, Integer stockLevel, Integer purchasedStock, String unit, Integer reorderThreshold, String supplierEmail, String supplierName, String status, String lastUpdated) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.stockLevel = stockLevel;
        this.purchasedStock = purchasedStock;
        this.unit = unit;
        this.reorderThreshold = reorderThreshold;
        this.supplierEmail = supplierEmail;
        this.supplierName = supplierName;
        this.status = status;
        this.lastUpdated = lastUpdated;
    }

    public InventoryItem(Long id, String name, String category, Integer stockLevel, String unit, Integer reorderThreshold, String supplierEmail, String supplierName, String status, String lastUpdated) {
        this(id, name, category, stockLevel, stockLevel != null ? (stockLevel <= 0 ? 100 : stockLevel * 2) : 1000, unit, reorderThreshold, supplierEmail, supplierName, status, lastUpdated);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getStockLevel() { return stockLevel; }
    public void setStockLevel(Integer stockLevel) { this.stockLevel = stockLevel; }

    public Integer getPurchasedStock() { return purchasedStock; }
    public void setPurchasedStock(Integer purchasedStock) { this.purchasedStock = purchasedStock; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Integer getReorderThreshold() { return reorderThreshold; }
    public void setReorderThreshold(Integer reorderThreshold) { this.reorderThreshold = reorderThreshold; }

    public String getSupplierEmail() { return supplierEmail; }
    public void setSupplierEmail(String supplierEmail) { this.supplierEmail = supplierEmail; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    public String getSupplierAcceptedAt() { return supplierAcceptedAt; }
    public void setSupplierAcceptedAt(String supplierAcceptedAt) { this.supplierAcceptedAt = supplierAcceptedAt; }

    public Boolean getAcceptedNotificationRead() { return acceptedNotificationRead != null ? acceptedNotificationRead : false; }
    public void setAcceptedNotificationRead(Boolean acceptedNotificationRead) { this.acceptedNotificationRead = acceptedNotificationRead; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getTotalPrice() {
        if (totalPrice != null && totalPrice > 0) return totalPrice;
        if (unitPrice != null && unitPrice > 0) {
            int qty = purchasedStock != null && purchasedStock > 0 ? purchasedStock : (stockLevel != null ? stockLevel : 1000);
            return Math.round(unitPrice * qty * 100.0) / 100.0;
        }
        return totalPrice;
    }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getSwiftCode() { return swiftCode; }
    public void setSwiftCode(String swiftCode) { this.swiftCode = swiftCode; }

    public String getBankNotes() { return bankNotes; }
    public void setBankNotes(String bankNotes) { this.bankNotes = bankNotes; }

    public String getPaymentStatus() { return paymentStatus != null ? paymentStatus : "Unpaid"; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaidAt() { return paidAt; }
    public void setPaidAt(String paidAt) { this.paidAt = paidAt; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { this.paymentTransactionId = paymentTransactionId; }

    public String getCardLastFour() { return cardLastFour; }
    public void setCardLastFour(String cardLastFour) { this.cardLastFour = cardLastFour; }

    public Boolean getSupplierPaymentNotificationRead() {
        return supplierPaymentNotificationRead != null ? supplierPaymentNotificationRead : false;
    }
    public void setSupplierPaymentNotificationRead(Boolean supplierPaymentNotificationRead) {
        this.supplierPaymentNotificationRead = supplierPaymentNotificationRead;
    }

    public Double getStockPercentage() {
        if (purchasedStock == null || purchasedStock <= 0) {
            if (stockLevel == null || stockLevel <= 0) return 0.0;
            return 100.0;
        }
        double pct = ((double) (stockLevel != null ? stockLevel : 0) / purchasedStock) * 100.0;
        return Math.round(pct * 10.0) / 10.0;
    }
}

