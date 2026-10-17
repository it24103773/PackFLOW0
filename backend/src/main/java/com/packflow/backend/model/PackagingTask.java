package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

/**
 * Entity for assigning plant staff and production tasks.
 * Mapped to table "packaing_tasks" as requested.
 */
@Entity
@Table(name = "packaing_tasks")
public class PackagingTask implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private String orderNumber;
    private String packagingType;
    private String teamLeader;
    private String staffMember;

    @Column(columnDefinition = "TEXT")
    private String taskDescription;

    @Column(columnDefinition = "TEXT")
    private String pmInstructions;

    private String status;       // "Assigned", "In Progress", "Completed"
    private String assignedBy;   // Packaging Manager who assigned the task
    private String createdAt;

    public PackagingTask() {
        this.status = "Assigned";
    }

    public PackagingTask(Long id, Long orderId, String orderNumber, String packagingType,
                         String teamLeader, String staffMember, String taskDescription,
                         String pmInstructions, String status, String assignedBy, String createdAt) {
        this.id = id;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.packagingType = packagingType;
        this.teamLeader = teamLeader;
        this.staffMember = staffMember;
        this.taskDescription = taskDescription;
        this.pmInstructions = pmInstructions;
        this.status = status != null ? status : "Assigned";
        this.assignedBy = assignedBy;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getPackagingType() { return packagingType; }
    public void setPackagingType(String packagingType) { this.packagingType = packagingType; }

    public String getTeamLeader() { return teamLeader; }
    public void setTeamLeader(String teamLeader) { this.teamLeader = teamLeader; }

    public String getStaffMember() { return staffMember; }
    public void setStaffMember(String staffMember) { this.staffMember = staffMember; }

    public String getTaskDescription() { return taskDescription; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }

    public String getPmInstructions() { return pmInstructions; }
    public void setPmInstructions(String pmInstructions) { this.pmInstructions = pmInstructions; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
