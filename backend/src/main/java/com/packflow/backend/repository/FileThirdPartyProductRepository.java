package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.ThirdPartyProduct;
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
public class FileThirdPartyProductRepository {

    private final String filePath = "storage/third_party_products.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaThirdPartyProductRepository jpaThirdPartyProductRepository;

    public FileThirdPartyProductRepository(@Lazy JpaThirdPartyProductRepository jpaThirdPartyProductRepository) {
        this.jpaThirdPartyProductRepository = jpaThirdPartyProductRepository;
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
                objectMapper.writeValue(file, createSeedProducts());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/third_party_products.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<ThirdPartyProduct> createSeedProducts() {
        return new ArrayList<>();
    }

    public List<ThirdPartyProduct> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(file, new TypeReference<List<ThirdPartyProduct>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<ThirdPartyProduct> findAll() {
        if (jpaThirdPartyProductRepository != null && jpaThirdPartyProductRepository.count() > 0) {
            return jpaThirdPartyProductRepository.findAll();
        }
        return findAllFromFile();
    }

    public Optional<ThirdPartyProduct> findById(Long id) {
        if (jpaThirdPartyProductRepository != null && jpaThirdPartyProductRepository.count() > 0) {
            return jpaThirdPartyProductRepository.findById(id);
        }
        return findAllFromFile().stream().filter(p -> p.getId() != null && p.getId().equals(id)).findFirst();
    }

    public ThirdPartyProduct save(ThirdPartyProduct product) {
        ThirdPartyProduct savedProduct = product;
        if (savedProduct.getCreatedAt() == null || savedProduct.getCreatedAt().isEmpty()) {
            savedProduct.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }

        if (jpaThirdPartyProductRepository != null) {
            savedProduct = jpaThirdPartyProductRepository.save(savedProduct);
        }

        lock.writeLock().lock();
        try {
            List<ThirdPartyProduct> list = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null && list.get(i).getId().equals(savedProduct.getId())) {
                    list.set(i, savedProduct);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                list.add(savedProduct);
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save third-party product to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return savedProduct;
    }

    public boolean deleteById(Long id) {
        if (jpaThirdPartyProductRepository != null && jpaThirdPartyProductRepository.existsById(id)) {
            jpaThirdPartyProductRepository.deleteById(id);
        }
        lock.writeLock().lock();
        try {
            List<ThirdPartyProduct> list = findAllFromFile();
            boolean removed = list.removeIf(p -> p.getId() != null && p.getId().equals(id));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed || (jpaThirdPartyProductRepository != null);
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
