package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "payments")
public class Payment implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String paymentCode;                 // Unique payment code e.g. "PAY-2026-001"
    private Long orderId;                        // Associated packaging order ID
    private String orderNumber;                  // Associated order number e.g. "ORD-2026-001"
    private String customerName;                 // Customer full name
    private String customerEmail;                // Customer email address
    private Double amount;                       // Payment amount in LKR
    private String paymentType;                  // "40% Advance Payment", "60% Final Balance", "Supplier Material Payment", "Full Payment"
    private String paymentMethod;                // "Visa / Credit Card", "Bank Transfer", "Direct Deposit"
    
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String paymentSlipUrl;               // Uploaded payment receipt / bank slip image Data URL

    private String paymentStatus;                // "Verified & Accepted", "Pending Verification", "Rejected (Invalid Slip)", "Paid", "Completed"

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;              // Reason if payment slip was rejected by admin

    private String transactionDate;              // ISO datetime string e.g. "2026-10-04T10:30:00"

    @Column(columnDefinition = "TEXT")
    private String notes;                        // Payment notes / reference details

    public Payment() {}

    public Payment(Long id, String paymentCode, Long orderId, String orderNumber, String customerName,
                   String customerEmail, Double amount, String paymentType, String paymentMethod,
                   String paymentSlipUrl, String paymentStatus, String rejectionReason,
                   String transactionDate, String notes) {
        this.id = id;
        this.paymentCode = paymentCode;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.amount = amount;
        this.paymentType = paymentType;
        this.paymentMethod = paymentMethod;
        this.paymentSlipUrl = paymentSlipUrl;
        this.paymentStatus = paymentStatus;
        this.rejectionReason = rejectionReason;
        this.transactionDate = transactionDate;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPaymentCode() {
        return paymentCode;
    }

    public void setPaymentCode(String paymentCode) {
        this.paymentCode = paymentCode;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentSlipUrl() {
        return paymentSlipUrl;
    }

    public void setPaymentSlipUrl(String paymentSlipUrl) {
        this.paymentSlipUrl = paymentSlipUrl;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(String transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
