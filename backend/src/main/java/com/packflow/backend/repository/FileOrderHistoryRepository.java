package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.OrderHistory;
import com.packflow.backend.model.PackagingOrder;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.stream.Collectors;

@Repository
public class FileOrderHistoryRepository {

    private final String filePath = "storage/order_history.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaOrderHistoryRepository jpaOrderHistoryRepository;

    public FileOrderHistoryRepository(@Lazy JpaOrderHistoryRepository jpaOrderHistoryRepository) {
        this.jpaOrderHistoryRepository = jpaOrderHistoryRepository;
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
                objectMapper.writeValue(file, new ArrayList<OrderHistory>());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/order_history.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<OrderHistory> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(file, new TypeReference<List<OrderHistory>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<OrderHistory> findAll() {
        if (jpaOrderHistoryRepository != null && jpaOrderHistoryRepository.count() > 0) {
            try {
                List<OrderHistory> list = jpaOrderHistoryRepository.findAll();
                list.sort((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L));
                return list;
            } catch (Exception e) {
                System.err.println("Failed to fetch order history from database, falling back to file: " + e.getMessage());
            }
        }
        return findAllFromFile();
    }

    public List<OrderHistory> findByOrderId(Long orderId) {
        if (orderId == null) return new ArrayList<>();
        if (jpaOrderHistoryRepository != null && jpaOrderHistoryRepository.count() > 0) {
            try {
                List<OrderHistory> list = jpaOrderHistoryRepository.findByOrderId(orderId);
                list.sort((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L));
                return list;
            } catch (Exception ignored) {}
        }
        return findAll().stream()
                .filter(h -> h.getOrderId() != null && h.getOrderId().equals(orderId))
                .collect(Collectors.toList());
    }

    public List<OrderHistory> findByCustomerEmail(String email) {
        if (email == null) return new ArrayList<>();
        if (jpaOrderHistoryRepository != null && jpaOrderHistoryRepository.count() > 0) {
            try {
                List<OrderHistory> list = jpaOrderHistoryRepository.findByCustomerEmail(email.trim());
                list.sort((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L));
                return list;
            } catch (Exception ignored) {}
        }
        return findAll().stream()
                .filter(h -> h.getCustomerEmail() != null && h.getCustomerEmail().equalsIgnoreCase(email.trim()))
                .collect(Collectors.toList());
    }

    public OrderHistory save(OrderHistory history) {
        if (history == null) return null;
        OrderHistory saved = history;
        if (saved.getCreatedAt() == null) {
            saved.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }

        if (jpaOrderHistoryRepository != null) {
            try {
                saved = jpaOrderHistoryRepository.save(saved);
            } catch (Exception e) {
                System.err.println("Database order history save warning: " + e.getMessage());
            }
        }

        lock.writeLock().lock();
        try {
            List<OrderHistory> list = findAllFromFile();
            if (saved.getId() == null) {
                long maxId = list.stream().mapToLong(h -> h.getId() != null ? h.getId() : 0L).max().orElse(0L);
                saved.setId(maxId + 1);
            }
            list.add(0, saved); // newest events first
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save order history to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return saved;
    }

    public OrderHistory recordEvent(PackagingOrder order, String eventDescription, String updatedBy) {
        if (order == null) return null;
        String desc = eventDescription;
        if (desc == null || desc.trim().isEmpty()) {
            desc = "Order #" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId())
                 + " (" + (order.getPackagingType() != null ? order.getPackagingType() : "Packaging") + ")"
                 + " status recorded as " + (order.getStatus() != null ? order.getStatus() : "Pending")
                 + " (" + (order.getProgressPercentage() != null ? order.getProgressPercentage() : 0) + "% progress).";
        }
        String by = (updatedBy != null && !updatedBy.trim().isEmpty()) ? updatedBy : "PackFLOW System";

        OrderHistory history = new OrderHistory(
            null,
            order.getId(),
            order.getOrderNumber() != null ? order.getOrderNumber() : ("ORD-2026-" + String.format("%03d", order.getId())),
            order.getCustomerName() != null ? order.getCustomerName() : "Customer",
            order.getCustomerEmail() != null ? order.getCustomerEmail() : "customer@packflow.com",
            order.getPackagingType() != null ? order.getPackagingType() : "Packaging Box",
            order.getQuantity() != null ? order.getQuantity() : 0,
            order.getTotalPrice() != null ? order.getTotalPrice() : 0.0,
            order.getStatus() != null ? order.getStatus() : "Pending",
            order.getProgressPercentage() != null ? order.getProgressPercentage() : 0,
            desc,
            by,
            LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );

        return save(history);
    }

    public void syncFromOrders(List<PackagingOrder> orders) {
        if (orders == null || orders.isEmpty()) return;

        List<OrderHistory> existingFile = findAllFromFile();
        Set<Long> existingOrderIds = existingFile.stream()
                .filter(h -> h.getOrderId() != null)
                .map(OrderHistory::getOrderId)
                .collect(Collectors.toSet());

        if (jpaOrderHistoryRepository != null && jpaOrderHistoryRepository.count() > 0) {
            try {
                jpaOrderHistoryRepository.findAll().forEach(h -> {
                    if (h.getOrderId() != null) existingOrderIds.add(h.getOrderId());
                });
            } catch (Exception ignored) {}
        }

        for (PackagingOrder o : orders) {
            if (o == null || o.getId() == null) continue;
            if (!existingOrderIds.contains(o.getId())) {
                recordEvent(
                    o,
                    "Order #" + (o.getOrderNumber() != null ? o.getOrderNumber() : o.getId()) + " (" + (o.getPackagingType() != null ? o.getPackagingType() : "Packaging") + ") status recorded as " + (o.getStatus() != null ? o.getStatus() : "Pending") + " (" + (o.getProgressPercentage() != null ? o.getProgressPercentage() : 0) + "% progress).",
                    "PackFLOW System"
                );
                existingOrderIds.add(o.getId());
            }
        }
    }
}
