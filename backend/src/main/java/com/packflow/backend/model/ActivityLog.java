package com.packflow.backend.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "activity_logs")
public class ActivityLog implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String timestamp;
    private String actorEmail;
    private String actorRole;
    private String action;
    @Column(columnDefinition = "TEXT")
    private String description;

    public ActivityLog() {}

    public ActivityLog(Long id, String timestamp, String actorEmail, String actorRole, String action, String description) {
        this.id = id;
        this.timestamp = timestamp;
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
