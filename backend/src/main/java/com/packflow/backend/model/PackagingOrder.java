package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "packaging_orders")
public class PackagingOrder implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String orderNumber;
    private String customerName;
    private String customerEmail;
    private String packagingType;
    private String dimensions;
    private Integer quantity;
    private String printFinish;
    private String status;        // "Pending", "Approved", "Ready for Placement", "In Progress", "Completed", "Denied"
    private Integer progressPercentage;
    private String assignedManager; // e.g. "Damsak (Packaging Manager)"
    @Column(columnDefinition = "TEXT")
    private String notes;
    private String targetDeadline;        // Customer provided order deadline date (YYYY-MM-DD)
    @Column(columnDefinition = "TEXT")
    private String customerInstructions; // Customer additional instructions
    private String startDate;             // Admin assigned order start date (YYYY-MM-DD)
    private String endDate;               // Automatically calculated end date (YYYY-MM-DD)
    private String assignedStaff;         // PM assigned staff summary
    private String teamLeader;            // PM assigned 4-member group leader
    @Column(columnDefinition = "TEXT")
    private String teamMembers;           // PM assigned 4 group members (comma separated)
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;       // Reason given by PM if process is rejected
    @Column(columnDefinition = "TEXT")
    private String pmInstructions;        // PM assigned production instructions for team
    @Column(columnDefinition = "TEXT")
    private String member1Task;           // Individual task assigned for Staff Member 1
    @Column(columnDefinition = "TEXT")
    private String member2Task;           // Individual task assigned for Staff Member 2
    @Column(columnDefinition = "TEXT")
    private String member3Task;           // Individual task assigned for Staff Member 3
    @Column(columnDefinition = "TEXT")
    private String member4Task;           // Individual task assigned for Staff Member 4
    @Column(columnDefinition = "TEXT")
    private String assignedTasksJson;     // PM assigned dynamic tasks list JSON: [{"member":"...", "task":"..."}, ...]
    private Double unitPrice;             // Price per unit (LKR)
    private Double subtotal;              // unitPrice * quantity
    private Double serviceCharge;         // 20% service charge (subtotal * 0.20)
    private Double totalPrice;            // subtotal + serviceCharge (Subtotal * 1.20)
    private Double advancePayment;        // 40% initial advance payment (totalPrice * 0.40)
    private Double remainingBalance;     // 60% remaining balance (totalPrice * 0.60)
    private String advancePaidStatus;     // "Paid (40% Advance)"
    private String paymentMethod;               // "Visa / Credit Card", "Bank Transfer"
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String paymentSlipUrl;              // Uploaded bank transfer slip image Data URL
    private String paymentStatus;               // "Verified & Accepted", "Pending Verification", "Rejected (Invalid Slip)", "Paid"
    @Column(columnDefinition = "TEXT")
    private String paymentRejectionReason;      // Reason if 40% slip rejected by admin
    private String finalPaymentMethod;          // "Visa / Credit Card", "Bank Transfer"
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String finalPaymentSlipUrl;         // Uploaded 60% final payment slip image Data URL
    private String finalPaymentStatus;          // "Verified & Accepted", "Pending Verification", "Rejected (Invalid Slip)", "Paid"
    @Column(columnDefinition = "TEXT")
    private String finalPaymentRejectionReason; // Reason if 60% slip rejected by admin
    private String createdAt;

    public PackagingOrder() {}

    public PackagingOrder(Long id, String orderNumber, String customerName, String customerEmail, String packagingType, String dimensions, Integer quantity, String printFinish, String status, Integer progressPercentage, String assignedManager, String notes, String targetDeadline, String customerInstructions, String startDate, String endDate, String createdAt) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.packagingType = packagingType;
        this.dimensions = dimensions;
        this.quantity = quantity;
        this.printFinish = printFinish;
        this.status = status;
        this.progressPercentage = progressPercentage;
        this.assignedManager = assignedManager;
        this.notes = notes;
        this.targetDeadline = targetDeadline;
        this.customerInstructions = customerInstructions;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getPackagingType() { return packagingType; }
    public void setPackagingType(String packagingType) { this.packagingType = packagingType; }

    public String getDimensions() { return dimensions; }
    public void setDimensions(String dimensions) { this.dimensions = dimensions; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getPrintFinish() { return printFinish; }
    public void setPrintFinish(String printFinish) { this.printFinish = printFinish; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public String getAssignedManager() { return assignedManager; }
    public void setAssignedManager(String assignedManager) { this.assignedManager = assignedManager; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getTargetDeadline() { return targetDeadline; }
    public void setTargetDeadline(String targetDeadline) { this.targetDeadline = targetDeadline; }

    public String getCustomerInstructions() { return customerInstructions; }
    public void setCustomerInstructions(String customerInstructions) { this.customerInstructions = customerInstructions; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getAssignedStaff() { return assignedStaff; }
    public void setAssignedStaff(String assignedStaff) { this.assignedStaff = assignedStaff; }

    public String getTeamLeader() { return teamLeader; }
    public void setTeamLeader(String teamLeader) { this.teamLeader = teamLeader; }

    public String getTeamMembers() { return teamMembers; }
    public void setTeamMembers(String teamMembers) { this.teamMembers = teamMembers; }

    public String getPmInstructions() { return pmInstructions; }
    public void setPmInstructions(String pmInstructions) { this.pmInstructions = pmInstructions; }

    public String getMember1Task() { return member1Task; }
    public void setMember1Task(String member1Task) { this.member1Task = member1Task; }

    public String getMember2Task() { return member2Task; }
    public void setMember2Task(String member2Task) { this.member2Task = member2Task; }

    public String getMember3Task() { return member3Task; }
    public void setMember3Task(String member3Task) { this.member3Task = member3Task; }

    public String getMember4Task() { return member4Task; }
    public void setMember4Task(String member4Task) { this.member4Task = member4Task; }

    public String getAssignedTasksJson() { return assignedTasksJson; }
    public void setAssignedTasksJson(String assignedTasksJson) { this.assignedTasksJson = assignedTasksJson; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getServiceCharge() { return serviceCharge; }
    public void setServiceCharge(Double serviceCharge) { this.serviceCharge = serviceCharge; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public Double getAdvancePayment() { return advancePayment; }
    public void setAdvancePayment(Double advancePayment) { this.advancePayment = advancePayment; }

    public Double getRemainingBalance() { return remainingBalance; }
    public void setRemainingBalance(Double remainingBalance) { this.remainingBalance = remainingBalance; }

    public String getAdvancePaidStatus() { return advancePaidStatus; }
    public void setAdvancePaidStatus(String advancePaidStatus) { this.advancePaidStatus = advancePaidStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentSlipUrl() { return paymentSlipUrl; }
    public void setPaymentSlipUrl(String paymentSlipUrl) { this.paymentSlipUrl = paymentSlipUrl; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentRejectionReason() { return paymentRejectionReason; }
    public void setPaymentRejectionReason(String paymentRejectionReason) { this.paymentRejectionReason = paymentRejectionReason; }

    public String getFinalPaymentMethod() { return finalPaymentMethod; }
    public void setFinalPaymentMethod(String finalPaymentMethod) { this.finalPaymentMethod = finalPaymentMethod; }

    public String getFinalPaymentSlipUrl() { return finalPaymentSlipUrl; }
    public void setFinalPaymentSlipUrl(String finalPaymentSlipUrl) { this.finalPaymentSlipUrl = finalPaymentSlipUrl; }

    public String getFinalPaymentStatus() { return finalPaymentStatus; }
    public void setFinalPaymentStatus(String finalPaymentStatus) { this.finalPaymentStatus = finalPaymentStatus; }

    public String getFinalPaymentRejectionReason() { return finalPaymentRejectionReason; }
    public void setFinalPaymentRejectionReason(String finalPaymentRejectionReason) { this.finalPaymentRejectionReason = finalPaymentRejectionReason; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
