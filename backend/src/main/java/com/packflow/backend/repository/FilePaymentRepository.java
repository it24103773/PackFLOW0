package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.Payment;
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
public class FilePaymentRepository {

    private final String filePath = "storage/payments.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaPaymentRepository jpaPaymentRepository;

    public FilePaymentRepository(@Lazy JpaPaymentRepository jpaPaymentRepository) {
        this.jpaPaymentRepository = jpaPaymentRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
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
                objectMapper.writeValue(file, createSeedPayments());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/payments.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<Payment> createSeedPayments() {
        List<Payment> list = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        list.add(new Payment(
            1L,
            "PAY-2026-001",
            1L,
            "ORD-2026-001",
            "Senura Perera",
            "senuraperera@packflow.com",
            468000.0,
            "40% Advance Payment",
            "Bank Transfer",
            null,
            "Verified & Accepted",
            null,
            baseTime.minusDays(5).format(fmt),
            "Advance payment 40% verified via Commercial Bank slip transfer."
        ));

        list.add(new Payment(
            2L,
            "PAY-2026-002",
            1L,
            "ORD-2026-001",
            "Senura Perera",
            "senuraperera@packflow.com",
            702000.0,
            "60% Final Balance",
            "Visa / Credit Card",
            null,
            "Paid",
            null,
            baseTime.minusDays(1).format(fmt),
            "Final 60% balance payment settled via online credit card portal."
        ));

        list.add(new Payment(
            3L,
            "PAY-2026-003",
            2L,
            "ORD-2026-002",
            "Nimal Jayasinghe",
            "customer@packflow.com",
            144000.0,
            "40% Advance Payment",
            "Bank Transfer",
            null,
            "Pending Verification",
            null,
            baseTime.minusHours(6).format(fmt),
            "Bank transfer slip submitted by customer for 40% advance payment, awaiting admin verification."
        ));

        return list;
    }

    public List<Payment> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return createSeedPayments();
            }
            return objectMapper.readValue(file, new TypeReference<List<Payment>>() {});
        } catch (IOException e) {
            return createSeedPayments();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<Payment> findAll() {
        if (jpaPaymentRepository != null && jpaPaymentRepository.count() > 0) {
            return jpaPaymentRepository.findAllByOrderByTransactionDateDesc();
        }
        List<Payment> list = findAllFromFile();
        list.sort((a, b) -> {
            if (a.getTransactionDate() == null) return 1;
            if (b.getTransactionDate() == null) return -1;
            return b.getTransactionDate().compareTo(a.getTransactionDate());
        });
        return list;
    }

    public List<Payment> findByCustomerEmail(String email) {
        if (email == null) return new ArrayList<>();
        return findAll().stream()
                .filter(p -> p.getCustomerEmail() != null && p.getCustomerEmail().equalsIgnoreCase(email.trim()))
                .collect(Collectors.toList());
    }

    public Optional<Payment> findById(Long id) {
        if (jpaPaymentRepository != null && jpaPaymentRepository.count() > 0) {
            return jpaPaymentRepository.findById(id);
        }
        return findAllFromFile().stream().filter(p -> p.getId() != null && p.getId().equals(id)).findFirst();
    }

    public Payment save(Payment payment) {
        Payment saved = payment;
        if (saved.getTransactionDate() == null || saved.getTransactionDate().trim().isEmpty()) {
            saved.setTransactionDate(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (saved.getPaymentCode() == null || saved.getPaymentCode().trim().isEmpty()) {
            saved.setPaymentCode("PAY-" + (1000 + (int)(Math.random() * 9000)));
        }

        if (jpaPaymentRepository != null) {
            saved = jpaPaymentRepository.save(saved);
        }

        lock.writeLock().lock();
        try {
            List<Payment> list = findAllFromFile();
            if (saved.getId() == null) {
                long maxId = list.stream().mapToLong(p -> p.getId() != null ? p.getId() : 0L).max().orElse(0L);
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
                list.add(0, saved);
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save payment to file: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return saved;
    }

    public void deleteById(Long id) {
        if (id == null) return;
        if (jpaPaymentRepository != null && jpaPaymentRepository.existsById(id)) {
            try {
                jpaPaymentRepository.deleteById(id);
            } catch (Exception e) {
                System.err.println("Error deleting payment from JPA: " + e.getMessage());
            }
        }

        lock.writeLock().lock();
        try {
            List<Payment> list = findAllFromFile();
            List<Payment> updatedList = list.stream()
                    .filter(p -> p.getId() != null && !p.getId().equals(id))
                    .collect(Collectors.toList());
            objectMapper.writeValue(new File(filePath), updatedList);
        } catch (IOException e) {
            System.err.println("Failed to delete payment from file: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }
}
