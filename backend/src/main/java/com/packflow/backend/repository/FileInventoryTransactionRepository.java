package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.InventoryTransaction;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Repository
public class FileInventoryTransactionRepository {

    private final String filePath = "storage/inventory_transactions.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaInventoryTransactionRepository jpaRepo;

    public FileInventoryTransactionRepository(@Lazy JpaInventoryTransactionRepository jpaRepo) {
        this.jpaRepo = jpaRepo;
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
                objectMapper.writeValue(file, createSeedTransactions());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/inventory_transactions.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<InventoryTransaction> createSeedTransactions() {
        List<InventoryTransaction> txns = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        txns.add(new InventoryTransaction(
            1L, "TXN-8001", 1L, "Kraft Paperboard Rolls (300 GSM)", "Cardboard & Paperboard",
            "STOCK_IN", 5000, 0, 5000, "Kg",
            "Yuthma Global Materials (Supplier)", "yuthma@packflow.com",
            baseTime.minusDays(7).format(fmt),
            "Initial raw packaging material batch delivered by supplier and accepted into warehouse stock."
        ));

        txns.add(new InventoryTransaction(
            2L, "TXN-8002", 1L, "Kraft Paperboard Rolls (300 GSM)", "Cardboard & Paperboard",
            "PRODUCTION_CONSUMPTION", -500, 5000, 4500, "Kg",
            "Bihan Silva (Inventory Manager)", "bihanbihan@packflow.com",
            baseTime.minusDays(4).format(fmt),
            "Allocated 500 Kg to Die-Cutting Line B for Order ORD-2026-001 (Corrugated Mailer Boxes)."
        ));

        txns.add(new InventoryTransaction(
            3L, "TXN-8003", 2L, "Corrugated Flute B Sheets", "Cardboard & Paperboard",
            "STOCK_IN", 1000, 0, 1000, "Sheets",
            "Yuthma Global Materials (Supplier)", "yuthma@packflow.com",
            baseTime.minusDays(6).format(fmt),
            "Supplier fulfilled purchase order for 1000 Corrugated Flute B Sheets."
        ));

        txns.add(new InventoryTransaction(
            4L, "TXN-8004", 2L, "Corrugated Flute B Sheets", "Cardboard & Paperboard",
            "STOCK_OUT", -150, 1000, 850, "Sheets",
            "Bihan Silva (Inventory Manager)", "bihanbihan@packflow.com",
            baseTime.minusDays(2).format(fmt),
            "Issued 150 Sheets for eco-friendly custom rigid box fabrication."
        ));

        txns.add(new InventoryTransaction(
            5L, "TXN-8005", 3L, "High-Density Polyethylene Film", "Plastics & Films",
            "STOCK_ADJUSTMENT", -150, 1000, 850, "Meters",
            "Bihan Silva (Inventory Manager)", "bihanbihan@packflow.com",
            baseTime.minusDays(3).format(fmt),
            "Manual stock adjustment after monthly physical warehouse count audit."
        ));

        txns.add(new InventoryTransaction(
            6L, "TXN-8006", 4L, "Heavy Duty Bubble Wrap Roll 100m", "Bubble Wrap & Cushioning",
            "PURCHASE_REORDER", 100, 20, 100, "Rolls",
            "Bihan Silva (Inventory Manager)", "bihanbihan@packflow.com",
            baseTime.minusDays(1).format(fmt),
            "Triggered automatic low-stock reorder to Yuthma Global Materials (Stock reached 20 Rolls)."
        ));

        txns.add(new InventoryTransaction(
            7L, "TXN-8007", 5L, "Industrial PVA Packaging Adhesive", "Tapes & Adhesives",
            "SUPPLIER_ACCEPTED", 1000, 0, 1000, "Liters",
            "Yuthma Global Materials (Supplier)", "yuthma@packflow.com",
            baseTime.minusHours(18).format(fmt),
            "Supplier accepted order request and confirmed dispatch of 1000 Liters."
        ));

        txns.add(new InventoryTransaction(
            8L, "TXN-8008", 6L, "Cyan Water-Based Flexo Ink", "Labels & Inks",
            "MATERIAL_REGISTERED", 500, 0, 350, "Liters",
            "Bihan Silva (Inventory Manager)", "bihanbihan@packflow.com",
            baseTime.minusHours(5).format(fmt),
            "Registered new packaging ink material catalog entry in system."
        ));

        return txns;
    }

    public List<InventoryTransaction> findAllFromFile() {
        lock.readLock().lock();
        File file = new File(filePath);
        try {
            if (!file.exists() || file.length() == 0) {
                return createSeedTransactions();
            }
            return objectMapper.readValue(file, new TypeReference<List<InventoryTransaction>>() {});
        } catch (Exception e) {
            return createSeedTransactions();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<InventoryTransaction> findAll() {
        if (jpaRepo != null && jpaRepo.count() > 0) {
            return jpaRepo.findAllByOrderByTimestampDesc();
        }
        List<InventoryTransaction> list = findAllFromFile();
        list.sort((a, b) -> {
            if (a.getTimestamp() == null) return 1;
            if (b.getTimestamp() == null) return -1;
            return b.getTimestamp().compareTo(a.getTimestamp());
        });
        return list;
    }

    public InventoryTransaction save(InventoryTransaction txn) {
        if (txn.getTimestamp() == null || txn.getTimestamp().trim().isEmpty()) {
            txn.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (txn.getTransactionCode() == null || txn.getTransactionCode().trim().isEmpty()) {
            txn.setTransactionCode("TXN-" + (1000 + new Random().nextInt(9000)));
        }

        InventoryTransaction savedTxn = txn;
        if (jpaRepo != null) {
            savedTxn = jpaRepo.save(savedTxn);
        }

        lock.writeLock().lock();
        try {
            List<InventoryTransaction> list = findAllFromFile();
            list.add(0, savedTxn);
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save inventory transaction: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return savedTxn;
    }

    public List<InventoryTransaction> findByItemId(Long itemId) {
        List<InventoryTransaction> all = findAll();
        List<InventoryTransaction> filtered = new ArrayList<>();
        for (InventoryTransaction t : all) {
            if (t.getItemId() != null && t.getItemId().equals(itemId)) {
                filtered.add(t);
            }
        }
        return filtered;
    }
}
