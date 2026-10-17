package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.List;

@Entity
@Table(name = "suppliers")
public class Supplier implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String companyName;
    private String contactPerson;
    private String email;
    private String phone;
    private String category;            // e.g. "Raw Materials & Inks", "Printing Inks", "Paper Substrates"
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "supplier_materials", joinColumns = @JoinColumn(name = "supplier_id"))
    @Column(name = "material")
    private List<String> suppliedMaterials;
    
    private String availabilityStatus; // "In Stock", "Limited", "Out of Stock"
    private Integer leadTimeDays;
    private String rating;
    private String status;              // "REGISTERED", "PENDING", "REJECTED"
    
    @Column(columnDefinition = "TEXT")
    private String inquiryMessage;
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
    @Column(columnDefinition = "TEXT")
    private String address;
    private String registrationDate;

    public Supplier() {}

    public Supplier(Long id, String companyName, String contactPerson, String email, String phone, String category, List<String> suppliedMaterials, String availabilityStatus, Integer leadTimeDays, String rating) {
        this.id = id;
        this.companyName = companyName;
        this.contactPerson = contactPerson;
        this.email = email;
        this.phone = phone;
        this.category = category;
        this.suppliedMaterials = suppliedMaterials;
        this.availabilityStatus = availabilityStatus;
        this.leadTimeDays = leadTimeDays;
        this.rating = rating;
        this.status = "REGISTERED";
    }

    public Supplier(Long id, String companyName, String contactPerson, String email, String phone, String category, List<String> suppliedMaterials, String availabilityStatus, Integer leadTimeDays, String rating, String status, String inquiryMessage, String rejectionReason, String address, String registrationDate) {
        this.id = id;
        this.companyName = companyName;
        this.contactPerson = contactPerson;
        this.email = email;
        this.phone = phone;
        this.category = category;
        this.suppliedMaterials = suppliedMaterials;
        this.availabilityStatus = availabilityStatus;
        this.leadTimeDays = leadTimeDays;
        this.rating = rating;
        this.status = status;
        this.inquiryMessage = inquiryMessage;
        this.rejectionReason = rejectionReason;
        this.address = address;
        this.registrationDate = registrationDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<String> getSuppliedMaterials() { return suppliedMaterials; }
    public void setSuppliedMaterials(List<String> suppliedMaterials) { this.suppliedMaterials = suppliedMaterials; }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public Integer getLeadTimeDays() { return leadTimeDays; }
    public void setLeadTimeDays(Integer leadTimeDays) { this.leadTimeDays = leadTimeDays; }

    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getInquiryMessage() { return inquiryMessage; }
    public void setInquiryMessage(String inquiryMessage) { this.inquiryMessage = inquiryMessage; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(String registrationDate) { this.registrationDate = registrationDate; }
}
