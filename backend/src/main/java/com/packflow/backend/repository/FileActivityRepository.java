package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.ActivityLog;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Repository
public class FileActivityRepository {

    private final String filePath = "storage/activities.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaActivityLogRepository jpaActivityLogRepository;

    public FileActivityRepository(@Lazy JpaActivityLogRepository jpaActivityLogRepository) {
        this.jpaActivityLogRepository = jpaActivityLogRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        ensureFileExists();
    }

    private void ensureFileExists() {
        lock.writeLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                if (file.getParentFile() != null) {
                    file.getParentFile().mkdirs();
                }
                file.createNewFile();
                objectMapper.writeValue(file, createSeedActivities());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/activities.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    private List<ActivityLog> createSeedActivities() {
        List<ActivityLog> logs = new ArrayList<>();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        logs.add(new ActivityLog(1L, now, "senuraperera@packflow.com", "System Administrator", "System Initialized", "PackFlow file-backed JSON repository storage mounted successfully."));
        logs.add(new ActivityLog(2L, now, "customer@packflow.com", "Customer", "Order Placed", "Submitted packaging requirement ORD-2026-001 (Corrugated Boxes)."));
        logs.add(new ActivityLog(3L, now, "damsakdamsak@packflow.com", "Packaging Manager", "Task Assigned", "Assigned order ORD-2026-001 to Die-Cutting Line B."));
        logs.add(new ActivityLog(4L, now, "bihanbihan@packflow.com", "Inventory Manager", "Low Stock Alert", "Corrugated Flute B Sheets dropped below threshold (1200 / 2000)."));
        logs.add(new ActivityLog(5L, now, "yuthma@packflow.com", "Supplier", "Material Stock Update", "Updated lead time to 3 days for Kraft Paperboard Rolls."));

        return logs;
    }

    public List<ActivityLog> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return createSeedActivities();
            }
            return objectMapper.readValue(file, new TypeReference<List<ActivityLog>>() {});
        } catch (IOException e) {
            System.err.println("Error reading activities: " + e.getMessage());
            return createSeedActivities();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<ActivityLog> findAll() {
        if (jpaActivityLogRepository != null && jpaActivityLogRepository.count() > 0) {
            List<ActivityLog> logs = new ArrayList<>(jpaActivityLogRepository.findAll());
            logs.sort((a, b) -> {
                if (b.getId() != null && a.getId() != null) {
                    return Long.compare(b.getId(), a.getId());
                }
                return 0;
            });
            return logs;
        }
        return findAllFromFile();
    }

    public void log(String actorEmail, String actorRole, String action, String description) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        ActivityLog newLog = new ActivityLog(null, now, actorEmail, actorRole, action, description);
        
        if (jpaActivityLogRepository != null) {
            newLog = jpaActivityLogRepository.save(newLog);
        }

        lock.writeLock().lock();
        try {
            List<ActivityLog> logs = findAllFromFile();
            logs.add(0, newLog);
            objectMapper.writeValue(new File(filePath), logs);
        } catch (IOException e) {
            System.err.println("Failed to write activity log to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }
}
