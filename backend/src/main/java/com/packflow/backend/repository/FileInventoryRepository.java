package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.InventoryItem;
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

@Repository
public class FileInventoryRepository {

    private final String filePath = "storage/inventory.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaInventoryRepository jpaInventoryRepository;

    public FileInventoryRepository(@Lazy JpaInventoryRepository jpaInventoryRepository) {
        this.jpaInventoryRepository = jpaInventoryRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        this.objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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
                objectMapper.writeValue(file, createSeedInventory());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/inventory.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<InventoryItem> createSeedInventory() {
        List<InventoryItem> items = new ArrayList<>();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        InventoryItem i1 = new InventoryItem(1L, "Kraft Paperboard Rolls (300 GSM)", "Cardboard & Paperboard", 4500, 5000, "Kg", 1000, "yuthma@packflow.com", "Yuthma Global Materials", "Accepted", now);
        i1.setUnitPrice(45.00); i1.setTotalPrice(225000.00); i1.setPaymentStatus("Paid"); items.add(i1);

        InventoryItem i2 = new InventoryItem(2L, "Corrugated Flute B Sheets", "Cardboard & Paperboard", 850, 1000, "Sheets", 200, "yuthma@packflow.com", "Yuthma Global Materials", "Accepted", now);
        i2.setUnitPrice(45.00); i2.setTotalPrice(45000.00); i2.setPaymentStatus("Paid"); items.add(i2);

        InventoryItem i3 = new InventoryItem(3L, "High-Density Polyethylene Film", "Plastics & Films", 850, 1000, "Meters", 200, "yuthma@packflow.com", "Yuthma Global Materials", "Accepted", now);
        i3.setUnitPrice(45.00); i3.setTotalPrice(45000.00); i3.setPaymentStatus("Paid"); items.add(i3);

        InventoryItem i4 = new InventoryItem(4L, "Heavy Duty Bubble Wrap Roll 100m", "Bubble Wrap & Cushioning", 80, 100, "Rolls", 20, "yuthma@packflow.com", "Yuthma Global Materials", "On-Going", now);
        i4.setUnitPrice(45.00); i4.setTotalPrice(4500.00); i4.setPaymentStatus("Unpaid"); items.add(i4);

        InventoryItem i5 = new InventoryItem(5L, "Industrial PVA Packaging Adhesive", "Tapes & Adhesives", 850, 1000, "Liters", 300, "yuthma@packflow.com", "Yuthma Global Materials", "Accepted", now);
        i5.setUnitPrice(45.00); i5.setTotalPrice(45000.00); i5.setPaymentStatus("Paid"); items.add(i5);

        InventoryItem i6 = new InventoryItem(6L, "Cyan Water-Based Flexo Ink", "Labels & Inks", 350, 500, "Liters", 100, "yuthma@packflow.com", "Yuthma Global Materials", "On-Going", now);
        i6.setUnitPrice(45.00); i6.setTotalPrice(22500.00); i6.setPaymentStatus("Unpaid"); items.add(i6);

        InventoryItem i7 = new InventoryItem(7L, "Amber Glass Jars 250ml", "Glass & Containers", 450, 500, "Boxes", 100, "yuthma@packflow.com", "Yuthma Global Materials", "Accepted", now);
        i7.setUnitPrice(45.00); i7.setTotalPrice(22500.00); i7.setPaymentStatus("Paid"); items.add(i7);

        InventoryItem i8 = new InventoryItem(8L, "Steel Strapping Tape 19mm", "Metal & Strapping", 400, 500, "Rolls", 100, "yuthma@packflow.com", "Yuthma Global Materials", "Accepted", now);
        i8.setUnitPrice(45.00); i8.setTotalPrice(22500.00); i8.setPaymentStatus("Paid"); items.add(i8);

        return items;
    }

    public List<InventoryItem> findAllFromFile() {
        lock.readLock().lock();
        File file = new File(filePath);
        try {
            if (!file.exists() || file.length() == 0) {
                return createSeedInventory();
            }
            List<InventoryItem> list = objectMapper.readValue(file, new TypeReference<List<InventoryItem>>() {});
            for (InventoryItem item : list) {
                if (item.getUnitPrice() == null || item.getUnitPrice() <= 0) {
                    item.setUnitPrice(45.00);
                }
                if (item.getTotalPrice() == null || item.getTotalPrice() <= 0) {
                    int qty = item.getPurchasedStock() != null && item.getPurchasedStock() > 0 ? item.getPurchasedStock() : (item.getStockLevel() != null ? item.getStockLevel() : 1000);
                    item.setTotalPrice(Math.round(item.getUnitPrice() * qty * 100.0) / 100.0);
                }
            }
            return list;
        } catch (Exception e) {
            return createSeedInventory();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<InventoryItem> findAll() {
        if (jpaInventoryRepository != null && jpaInventoryRepository.count() > 0) {
            return jpaInventoryRepository.findAll();
        }
        return findAllFromFile();
    }

    public Optional<InventoryItem> findById(Long id) {
        if (jpaInventoryRepository != null && jpaInventoryRepository.count() > 0) {
            return jpaInventoryRepository.findById(id);
        }
        return findAllFromFile().stream().filter(item -> item.getId() != null && item.getId().equals(id)).findFirst();
    }

    public InventoryItem save(InventoryItem item) {
        InventoryItem savedItem = item;
        if (savedItem.getLastUpdated() == null || savedItem.getLastUpdated().trim().isEmpty()) {
            savedItem.setLastUpdated(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (jpaInventoryRepository != null) {
            savedItem = jpaInventoryRepository.save(savedItem);
        }
        lock.writeLock().lock();
        try {
            List<InventoryItem> list = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null && list.get(i).getId().equals(savedItem.getId())) {
                    list.set(i, savedItem);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                list.add(savedItem);
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save inventory item to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return savedItem;
    }

    public boolean deleteById(Long id) {
        if (jpaInventoryRepository != null && jpaInventoryRepository.existsById(id)) {
            jpaInventoryRepository.deleteById(id);
        }
        lock.writeLock().lock();
        try {
            List<InventoryItem> list = findAllFromFile();
            boolean removed = list.removeIf(item -> item.getId() != null && item.getId().equals(id));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed || (jpaInventoryRepository != null);
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
