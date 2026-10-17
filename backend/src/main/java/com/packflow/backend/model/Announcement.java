package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "announcements")
public class Announcement implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String targetAudience; // "All", "Customers", "Suppliers"

    private String priority; // "Urgent", "Important", "Normal"

    private String author; // e.g. "System Administrator"

    private String createdAt;

    public Announcement() {}

    public Announcement(Long id, String title, String message, String targetAudience, String priority, String author, String createdAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.targetAudience = targetAudience;
        this.priority = priority;
        this.author = author;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
