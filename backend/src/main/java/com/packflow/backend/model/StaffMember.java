package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "staff_members")
public class StaffMember implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String employeeId;
    private String fullName;
    private String roleSpecialty; // e.g. "Flexo Printing Specialist", "Die-Cutting Lead", "Quality Inspector", "Assembly & Folding Lead"
    private String department;    // e.g. "Plant Operations", "Quality Assurance", "Pre-Press & Die-Cutting", "Final Packaging"
    private String contactNumber;
    private String email;
    private String shift;         // e.g. "Day Shift (08:00 - 16:30)", "Night Shift (16:30 - 01:00)"
    private String status;        // "Active", "Assigned to Production", "On Leave"
    private String createdAt;

    public StaffMember() {}

    public StaffMember(Long id, String employeeId, String fullName, String roleSpecialty, String department, String contactNumber, String email, String shift, String status, String createdAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.roleSpecialty = roleSpecialty;
        this.department = department;
        this.contactNumber = contactNumber;
        this.email = email;
        this.shift = shift;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRoleSpecialty() { return roleSpecialty; }
    public void setRoleSpecialty(String roleSpecialty) { this.roleSpecialty = roleSpecialty; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
