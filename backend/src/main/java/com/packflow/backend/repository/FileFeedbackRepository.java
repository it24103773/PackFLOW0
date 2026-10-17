package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.Feedback;
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
public class FileFeedbackRepository {

    private final String filePath = "storage/feedbacks.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaFeedbackRepository jpaFeedbackRepository;

    public FileFeedbackRepository(@Lazy JpaFeedbackRepository jpaFeedbackRepository) {
        this.jpaFeedbackRepository = jpaFeedbackRepository;
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
                objectMapper.writeValue(file, createSeedFeedbacks());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/feedbacks.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<Feedback> createSeedFeedbacks() {
        List<Feedback> list = new ArrayList<>();
        list.add(new Feedback(
            1L,
            "Senura Perera",
            "senuraperera@packflow.com",
            "Great Corrugated Box Compression Quality",
            "The double wall corrugated boxes delivered last week were exceptional. Burst strength matched specs perfectly!",
            5,
            "Responded",
            "Thank you Senura! Glad to hear our quality inspection met your expectations. We look forward to your next order.",
            "System Administrator",
            LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            LocalDateTime.now().minusDays(2).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        ));
        list.add(new Feedback(
            2L,
            "Nimal Jayasinghe",
            "customer@packflow.com",
            "Inquiry on Bulk Mailer Pouch Delivery Times",
            "Hi PackFLOW team, can we request custom gloss lamination finish on folding cartons for our next 2,000 unit batch?",
            4,
            "Pending Response",
            null,
            null,
            null,
            LocalDateTime.now().minusHours(4).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        ));
        return list;
    }

    public List<Feedback> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(file, new TypeReference<List<Feedback>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<Feedback> findAll() {
        if (jpaFeedbackRepository != null && jpaFeedbackRepository.count() > 0) {
            return jpaFeedbackRepository.findAll();
        }
        return findAllFromFile();
    }

    public List<Feedback> findByCustomerEmail(String email) {
        if (email == null) return new ArrayList<>();
        return findAll().stream()
                .filter(f -> f.getCustomerEmail() != null && f.getCustomerEmail().equalsIgnoreCase(email.trim()))
                .collect(Collectors.toList());
    }

    public Optional<Feedback> findById(Long id) {
        if (jpaFeedbackRepository != null && jpaFeedbackRepository.count() > 0) {
            return jpaFeedbackRepository.findById(id);
        }
        return findAllFromFile().stream().filter(f -> f.getId() != null && f.getId().equals(id)).findFirst();
    }

    public Feedback save(Feedback feedback) {
        Feedback saved = feedback;
        if (saved.getCreatedAt() == null) {
            saved.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (saved.getStatus() == null) {
            saved.setStatus("Pending Response");
        }

        if (jpaFeedbackRepository != null) {
            saved = jpaFeedbackRepository.save(saved);
        }

        lock.writeLock().lock();
        try {
            List<Feedback> list = findAllFromFile();
            if (saved.getId() == null) {
                long maxId = list.stream().mapToLong(f -> f.getId() != null ? f.getId() : 0L).max().orElse(0L);
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
                list.add(0, saved); // newest first
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save feedback to file: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return saved;
    }

    public void deleteById(Long id) {
        if (id == null) return;
        if (jpaFeedbackRepository != null && jpaFeedbackRepository.existsById(id)) {
            try {
                jpaFeedbackRepository.deleteById(id);
            } catch (Exception e) {
                System.err.println("Error deleting feedback from JPA: " + e.getMessage());
            }
        }

        lock.writeLock().lock();
        try {
            List<Feedback> list = findAllFromFile();
            List<Feedback> updatedList = list.stream()
                    .filter(f -> f.getId() != null && !f.getId().equals(id))
                    .collect(Collectors.toList());
            objectMapper.writeValue(new File(filePath), updatedList);
        } catch (IOException e) {
            System.err.println("Failed to delete feedback from file: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }
}
