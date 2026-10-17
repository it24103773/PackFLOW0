package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.Product;
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
public class FileProductRepository {

    private final String filePath = "storage/products.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaProductRepository jpaProductRepository;

    public FileProductRepository(@Lazy JpaProductRepository jpaProductRepository) {
        this.jpaProductRepository = jpaProductRepository;
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
            System.err.println("Error initializing storage/products.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<Product> createSeedProducts() {
        List<Product> products = new ArrayList<>();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        products.add(new Product(1L, "Heavy Duty Corrugated Shipping Box", "PROD-BOX-001", "Corrugated Box", "400 x 300 x 250 mm", "Kraft Double Wall B-Flute", "Active", now));
        products.add(new Product(2L, "Custom Gloss Printed Folding Carton", "PROD-CART-002", "Folding Carton", "150 x 100 x 50 mm", "350 GSM Premium Bleached Board", "Active", now));
        products.add(new Product(3L, "Luxury Rigid Presentation Box with Magnetic Closure", "PROD-RIGID-003", "Rigid Box", "250 x 200 x 80 mm", "1200 GSM Greyboard + Matte Laminate", "Active", now));
        products.add(new Product(4L, "Barrier Foil Sealed Flexible Pouch", "PROD-POUCH-004", "Flexible Pouch", "180 x 260 mm", "PET/AL/PE Laminated Film", "Active", now));

        return products;
    }

    public List<Product> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return createSeedProducts();
            }
            return objectMapper.readValue(file, new TypeReference<List<Product>>() {});
        } catch (IOException e) {
            return createSeedProducts();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<Product> findAll() {
        if (jpaProductRepository != null && jpaProductRepository.count() > 0) {
            return jpaProductRepository.findAll();
        }
        return findAllFromFile();
    }

    public Optional<Product> findById(Long id) {
        if (jpaProductRepository != null && jpaProductRepository.count() > 0) {
            return jpaProductRepository.findById(id);
        }
        return findAllFromFile().stream().filter(p -> p.getId() != null && p.getId().equals(id)).findFirst();
    }

    public Product save(Product product) {
        Product savedProduct = product;
        if (savedProduct.getCreatedAt() == null || savedProduct.getCreatedAt().isEmpty()) {
            savedProduct.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }

        if (jpaProductRepository != null) {
            savedProduct = jpaProductRepository.save(savedProduct);
        }

        lock.writeLock().lock();
        try {
            List<Product> list = findAllFromFile();
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
            System.err.println("Failed to save product to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return savedProduct;
    }

    public boolean deleteById(Long id) {
        if (jpaProductRepository != null && jpaProductRepository.existsById(id)) {
            jpaProductRepository.deleteById(id);
        }
        lock.writeLock().lock();
        try {
            List<Product> list = findAllFromFile();
            boolean removed = list.removeIf(p -> p.getId() != null && p.getId().equals(id));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed || (jpaProductRepository != null);
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
