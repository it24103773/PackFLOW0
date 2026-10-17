package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "users")
public class User implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fullName;
    private String email;
    private String password;
    @Column(name = "user_role")
    private String role;
    private String mobileNumber;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    private String status; // "PENDING", "REGISTERED", "REJECTED"
    private String registrationDate;

    public User() {
    }

    public User(Long id, String fullName, String email, String password, String role, String mobileNumber, String address, String status, String registrationDate) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.mobileNumber = mobileNumber;
        this.address = address;
        this.status = status;
        this.registrationDate = registrationDate;
    }

    public User(Long id, String fullName, String email, String password, String role, String mobileNumber, String status, String registrationDate) {
        this(id, fullName, email, password, role, mobileNumber, null, status, registrationDate);
    }

    public User(Long id, String fullName, String email, String password, String role, String registrationDate) {
        this(id, fullName, email, password, role, "+1 (555) 234-5678", null, "REGISTERED", registrationDate);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @PrePersist
    @PreUpdate
    public void ensureRoleAndStatus() {
        if (this.role == null || this.role.trim().isEmpty()) {
            this.role = getRole();
        }
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = "REGISTERED";
        }
    }

    public String getRole() {
        if (role != null && !role.trim().isEmpty()) {
            return role;
        }
        if (email != null) {
            String clean = email.trim().toLowerCase();
            if (clean.equals("senuraperera@packflow.com") || clean.equals("senuraperera@packflowcom")) {
                return "System Administrator";
            } else if (clean.equals("bihanbihan@packflow.com")) {
                return "Inventory Manager";
            } else if (clean.equals("damsakdamsak@packflow.com")) {
                return "Packaging Manager";
            } else if (clean.equals("yuthma@packflow.com")) {
                return "Supplier";
            }
        }
        return "Customer";
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getUserRole() {
        return getRole();
    }

    public void setUserRole(String userRole) {
        this.role = userRole;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(String registrationDate) {
        this.registrationDate = registrationDate;
    }
}


