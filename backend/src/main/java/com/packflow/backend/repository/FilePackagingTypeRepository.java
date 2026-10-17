package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.PackagingType;
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
public class FilePackagingTypeRepository {

    private final String filePath = "storage/packaging_types.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaPackagingTypeRepository jpaPackagingTypeRepository;

    public FilePackagingTypeRepository(@Lazy JpaPackagingTypeRepository jpaPackagingTypeRepository) {
        this.jpaPackagingTypeRepository = jpaPackagingTypeRepository;
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
                objectMapper.writeValue(file, createSeedTypes());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/packaging_types.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<PackagingType> createSeedTypes() {
        List<PackagingType> types = new ArrayList<>();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        types.add(new PackagingType(
            1L,
            "Corrugated Box",
            "Heavy-duty shipping boxes with single/double wall flute structure.",
            100, 1200,
            100, 800,
            50, 600,
            50.0,
            "Kraft Double Wall B-Flute, Single Wall E-Flute, Heavy Duty C-Flute",
            150.0,
            "Active",
            now
        ));

        types.add(new PackagingType(
            2L,
            "Folding Carton",
            "Lightweight paperboard cartons for retail display and consumer products.",
            50, 500,
            30, 400,
            20, 300,
            5.0,
            "350 GSM Premium Bleached Board, Kraft Folding Board, Recycled Board",
            90.0,
            "Active",
            now
        ));

        types.add(new PackagingType(
            3L,
            "Rigid Box",
            "Sturdy premium presentation boxes with greyboard structural core.",
            80, 600,
            80, 400,
            30, 200,
            12.0,
            "1200 GSM Greyboard + Matte Laminate, Soft Touch Velvet Finish, Foil Stamped Board",
            350.0,
            "Active",
            now
        ));

        types.add(new PackagingType(
            4L,
            "Flexible Pouch",
            "Barrier foil pouch for food powders, liquids, and pharmaceutical items.",
            50, 400,
            50, 400,
            10, 150,
            3.0,
            "PET/AL/PE Laminated Film, Eco Kraft Barrier Foil, Clear Poly Pouch",
            70.0,
            "Active",
            now
        ));

        types.add(new PackagingType(
            5L,
            "Mailer Box",
            "Self-locking corrugated e-commerce shipping boxes.",
            100, 600,
            100, 500,
            30, 300,
            15.0,
            "White E-Flute, Kraft E-Flute Board",
            120.0,
            "Active",
            now
        ));

        return types;
    }

    public List<PackagingType> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return createSeedTypes();
            }
            return objectMapper.readValue(file, new TypeReference<List<PackagingType>>() {});
        } catch (IOException e) {
            return createSeedTypes();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<PackagingType> findAll() {
        if (jpaPackagingTypeRepository != null && jpaPackagingTypeRepository.count() > 0) {
            return jpaPackagingTypeRepository.findAll();
        }
        return findAllFromFile();
    }

    public Optional<PackagingType> findById(Long id) {
        if (jpaPackagingTypeRepository != null && jpaPackagingTypeRepository.count() > 0) {
            return jpaPackagingTypeRepository.findById(id);
        }
        return findAllFromFile().stream().filter(t -> t.getId() != null && t.getId().equals(id)).findFirst();
    }

    public PackagingType save(PackagingType type) {
        PackagingType savedType = type;
        if (savedType.getCreatedAt() == null || savedType.getCreatedAt().isEmpty()) {
            savedType.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }

        if (jpaPackagingTypeRepository != null) {
            savedType = jpaPackagingTypeRepository.save(savedType);
        }

        lock.writeLock().lock();
        try {
            List<PackagingType> list = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null && list.get(i).getId().equals(savedType.getId())) {
                    list.set(i, savedType);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                list.add(savedType);
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save packaging type to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return savedType;
    }

    public boolean deleteById(Long id) {
        if (jpaPackagingTypeRepository != null && jpaPackagingTypeRepository.existsById(id)) {
            jpaPackagingTypeRepository.deleteById(id);
        }
        lock.writeLock().lock();
        try {
            List<PackagingType> list = findAllFromFile();
            boolean removed = list.removeIf(t -> t.getId() != null && t.getId().equals(id));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed || (jpaPackagingTypeRepository != null);
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
