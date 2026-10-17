package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.Supplier;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Repository
public class FileSupplierRepository {

    private final String filePath = "storage/suppliers.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaSupplierRepository jpaSupplierRepository;

    public FileSupplierRepository(@Lazy JpaSupplierRepository jpaSupplierRepository) {
        this.jpaSupplierRepository = jpaSupplierRepository;
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
                objectMapper.writeValue(file, createSeedSuppliers());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/suppliers.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<Supplier> createSeedSuppliers() {
        List<Supplier> suppliers = new ArrayList<>();

        suppliers.add(new Supplier(
            1L, "Yuthma Global Materials", "Yuthma Perera", "yuthma@packflow.com",
            "+94 11 234 5678", "Raw Materials & Inks",
            List.of("Kraft Paperboard Rolls", "Corrugated Flute Sheets", "Cyan Flexo Ink", "Matte Lamination Film"),
            "In Stock", 3, "4.9 / 5.0"
        ));

        suppliers.add(new Supplier(
            2L, "Lanka Coating Solutions", "Kavinda Fernando", "info@lankacoating.lk",
            "+94 11 876 5432", "Coatings & Laminations",
            List.of("UV Varnish Coating", "Aqueous Protective Coating", "Gloss Thermal Film"),
            "Limited", 5, "4.7 / 5.0"
        ));

        return suppliers;
    }

    public List<Supplier> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return createSeedSuppliers();
            }
            return objectMapper.readValue(file, new TypeReference<List<Supplier>>() {});
        } catch (IOException e) {
            return createSeedSuppliers();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<Supplier> findAll() {
        if (jpaSupplierRepository != null && jpaSupplierRepository.count() > 0) {
            return jpaSupplierRepository.findAll();
        }
        return findAllFromFile();
    }

    public Optional<Supplier> findById(Long id) {
        if (id == null) return Optional.empty();
        if (jpaSupplierRepository != null && jpaSupplierRepository.count() > 0) {
            return jpaSupplierRepository.findById(id);
        }
        return findAllFromFile().stream()
                .filter(s -> id.equals(s.getId()))
                .findFirst();
    }

    public Optional<Supplier> findByEmail(String email) {
        if (email == null) return Optional.empty();
        if (jpaSupplierRepository != null && jpaSupplierRepository.count() > 0) {
            return jpaSupplierRepository.findByEmailIgnoreCase(email.trim());
        }
        return findAllFromFile().stream()
                .filter(s -> s.getEmail() != null && s.getEmail().equalsIgnoreCase(email.trim()))
                .findFirst();
    }

    public Supplier save(Supplier supplier) {
        Supplier savedSupplier = supplier;
        if (jpaSupplierRepository != null) {
            savedSupplier = jpaSupplierRepository.save(savedSupplier);
        }

        lock.writeLock().lock();
        try {
            List<Supplier> list = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null && list.get(i).getId().equals(savedSupplier.getId())) {
                    list.set(i, savedSupplier);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                list.add(savedSupplier);
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save supplier to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return savedSupplier;
    }

    public boolean deleteById(Long id) {
        if (id == null) return false;
        if (jpaSupplierRepository != null && jpaSupplierRepository.existsById(id)) {
            jpaSupplierRepository.deleteById(id);
        }
        lock.writeLock().lock();
        try {
            List<Supplier> list = findAllFromFile();
            boolean removed = list.removeIf(s -> id.equals(s.getId()));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed || (jpaSupplierRepository != null);
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean deleteByEmail(String email) {
        if (email == null) return false;
        Optional<Supplier> s = findByEmail(email);
        if (s.isPresent()) {
            return deleteById(s.get().getId());
        }
        return false;
    }
}
