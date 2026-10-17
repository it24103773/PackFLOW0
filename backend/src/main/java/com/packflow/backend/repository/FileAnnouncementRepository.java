package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.Announcement;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.stream.Collectors;

@Repository
public class FileAnnouncementRepository {

    private final String filePath = "storage/announcements.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaAnnouncementRepository jpaAnnouncementRepository;

    public FileAnnouncementRepository(@Lazy JpaAnnouncementRepository jpaAnnouncementRepository) {
        this.jpaAnnouncementRepository = jpaAnnouncementRepository;
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
                objectMapper.writeValue(file, createSeedAnnouncements());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/announcements.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<Announcement> createSeedAnnouncements() {
        List<Announcement> list = new ArrayList<>();
        list.add(new Announcement(1L, "System Maintenance Notice", "PackFLOW platform backend will undergo scheduled optimization tonight from 11:00 PM to 11:30 PM.", "All", "Important", "System Administrator", LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));
        list.add(new Announcement(2L, "New Eco Packaging Materials Available", "Kraft double wall & recyclable pouch specs are now unlocked for all custom quote requests.", "Customers", "Normal", "Damsak (Packaging Manager)", LocalDateTime.now().minusHours(5).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));
        list.add(new Announcement(3L, "Supplier Raw Material Dispatch Schedule Update", "Please update your available inventory stock levels before Friday dispatches.", "Suppliers", "Urgent", "System Administrator", LocalDateTime.now().minusHours(2).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));
        return list;
    }

    public List<Announcement> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(file, new TypeReference<List<Announcement>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<Announcement> findAll() {
        if (jpaAnnouncementRepository != null && jpaAnnouncementRepository.count() > 0) {
            return jpaAnnouncementRepository.findAll();
        }
        return findAllFromFile();
    }

    public Optional<Announcement> findById(Long id) {
        if (jpaAnnouncementRepository != null && jpaAnnouncementRepository.count() > 0) {
            return jpaAnnouncementRepository.findById(id);
        }
        return findAllFromFile().stream().filter(a -> a.getId() != null && a.getId().equals(id)).findFirst();
    }

    public Announcement save(Announcement announcement) {
        Announcement saved = announcement;
        if (saved.getCreatedAt() == null) {
            saved.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }

        if (jpaAnnouncementRepository != null) {
            saved = jpaAnnouncementRepository.save(saved);
        }

        lock.writeLock().lock();
        try {
            List<Announcement> list = findAllFromFile();
            if (saved.getId() == null) {
                long maxId = list.stream().mapToLong(a -> a.getId() != null ? a.getId() : 0L).max().orElse(0L);
                saved.setId(maxId + 1);
            }
            boolean updated = false;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null && list.get(i).getId().equals(saved.getId())) {
                    list.set(i, saved);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                list.add(0, saved); // latest first
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save announcement to file: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return saved;
    }

    public boolean deleteById(Long id) {
        if (id == null) return false;
        if (jpaAnnouncementRepository != null && jpaAnnouncementRepository.count() > 0) {
            try { jpaAnnouncementRepository.deleteById(id); } catch (Exception ignored) {}
        }
        lock.writeLock().lock();
        try {
            List<Announcement> list = findAllFromFile();
            boolean removed = list.removeIf(a -> a.getId() != null && a.getId().equals(id));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed;
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
