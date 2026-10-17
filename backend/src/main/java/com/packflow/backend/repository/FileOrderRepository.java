package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.PackagingOrder;
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
public class FileOrderRepository {

    private final String filePath = "storage/orders.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaOrderRepository jpaOrderRepository;
    private final FileOrderHistoryRepository fileOrderHistoryRepository;

    public FileOrderRepository(
            @Lazy JpaOrderRepository jpaOrderRepository,
            @Lazy FileOrderHistoryRepository fileOrderHistoryRepository) {
        this.jpaOrderRepository = jpaOrderRepository;
        this.fileOrderHistoryRepository = fileOrderHistoryRepository;
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
                objectMapper.writeValue(file, createSeedOrders());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/orders.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<PackagingOrder> createSeedOrders() {
        return new ArrayList<>();
    }

    public List<PackagingOrder> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(file, new TypeReference<List<PackagingOrder>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<PackagingOrder> findAll() {
        if (jpaOrderRepository != null && jpaOrderRepository.count() > 0) {
            return jpaOrderRepository.findAll();
        }
        return findAllFromFile();
    }

    public List<PackagingOrder> findByCustomerEmail(String email) {
        if (email == null) return new ArrayList<>();
        return findAll().stream()
                .filter(o -> o.getCustomerEmail() != null && o.getCustomerEmail().equalsIgnoreCase(email.trim()))
                .collect(Collectors.toList());
    }

    public Optional<PackagingOrder> findById(Long id) {
        if (jpaOrderRepository != null && jpaOrderRepository.count() > 0) {
            return jpaOrderRepository.findById(id);
        }
        return findAllFromFile().stream().filter(o -> o.getId() != null && o.getId().equals(id)).findFirst();
    }

    public PackagingOrder save(PackagingOrder order) {
        return save(order, null, "PackFLOW System");
    }

    public PackagingOrder save(PackagingOrder order, String eventDescription, String updatedBy) {
        PackagingOrder savedOrder = order;
        if (savedOrder.getStatus() == null) savedOrder.setStatus("Pending");
        if (savedOrder.getProgressPercentage() == null) savedOrder.setProgressPercentage(0);
        if (savedOrder.getCreatedAt() == null) savedOrder.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        if (jpaOrderRepository != null) {
            try {
                savedOrder = jpaOrderRepository.save(savedOrder);
                if (savedOrder.getOrderNumber() == null || savedOrder.getOrderNumber().trim().isEmpty()) {
                    savedOrder.setOrderNumber("ORD-2026-" + String.format("%03d", savedOrder.getId()));
                    savedOrder = jpaOrderRepository.save(savedOrder);
                }
            } catch (Exception e) {
                System.err.println("Database order save warning: " + e.getMessage());
            }
        }

        lock.writeLock().lock();
        try {
            List<PackagingOrder> list = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null && list.get(i).getId().equals(savedOrder.getId())) {
                    list.set(i, savedOrder);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                list.add(savedOrder);
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save order to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }

        if (fileOrderHistoryRepository != null) {
            try {
                fileOrderHistoryRepository.recordEvent(savedOrder, eventDescription, updatedBy);
            } catch (Exception e) {
                System.err.println("Failed to record order history for order #" + savedOrder.getId() + ": " + e.getMessage());
            }
        }

        return savedOrder;
    }

    public boolean deleteById(Long id) {
        if (id == null) return false;
        if (jpaOrderRepository != null && jpaOrderRepository.count() > 0) {
            try { jpaOrderRepository.deleteById(id); } catch (Exception ignored) {}
        }
        lock.writeLock().lock();
        try {
            List<PackagingOrder> list = findAllFromFile();
            boolean removed = list.removeIf(o -> o.getId() != null && o.getId().equals(id));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed;
        } catch (IOException e) {
            System.err.println("Failed to delete order from file backup: " + e.getMessage());
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
