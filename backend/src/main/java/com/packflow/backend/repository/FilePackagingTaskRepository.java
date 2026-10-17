package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.PackagingOrder;
import com.packflow.backend.model.PackagingTask;
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
public class FilePackagingTaskRepository {

    private final String filePath = "storage/packaing_tasks.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaPackagingTaskRepository jpaPackagingTaskRepository;

    public FilePackagingTaskRepository(@Lazy JpaPackagingTaskRepository jpaPackagingTaskRepository) {
        this.jpaPackagingTaskRepository = jpaPackagingTaskRepository;
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
                objectMapper.writeValue(file, new ArrayList<PackagingTask>());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/packaing_tasks.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<PackagingTask> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(file, new TypeReference<List<PackagingTask>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<PackagingTask> findAll() {
        if (jpaPackagingTaskRepository != null && jpaPackagingTaskRepository.count() > 0) {
            return jpaPackagingTaskRepository.findAll();
        }
        return findAllFromFile();
    }

    public Optional<PackagingTask> findById(Long id) {
        if (jpaPackagingTaskRepository != null && jpaPackagingTaskRepository.count() > 0) {
            return jpaPackagingTaskRepository.findById(id);
        }
        return findAllFromFile().stream().filter(t -> t.getId() != null && t.getId().equals(id)).findFirst();
    }

    public List<PackagingTask> findByOrderId(Long orderId) {
        if (jpaPackagingTaskRepository != null && jpaPackagingTaskRepository.count() > 0) {
            return jpaPackagingTaskRepository.findByOrderId(orderId);
        }
        return findAllFromFile().stream().filter(t -> t.getOrderId() != null && t.getOrderId().equals(orderId)).collect(Collectors.toList());
    }

    public List<PackagingTask> findByOrderIdAndStaffMember(Long orderId, String staffMember) {
        if (jpaPackagingTaskRepository != null && jpaPackagingTaskRepository.count() > 0) {
            return jpaPackagingTaskRepository.findByOrderIdAndStaffMember(orderId, staffMember);
        }
        return findAllFromFile().stream()
                .filter(t -> t.getOrderId() != null && t.getOrderId().equals(orderId) && t.getStaffMember() != null && t.getStaffMember().trim().equalsIgnoreCase(staffMember != null ? staffMember.trim() : ""))
                .collect(Collectors.toList());
    }

    public List<PackagingTask> findByStaffMember(String staffMember) {
        if (jpaPackagingTaskRepository != null && jpaPackagingTaskRepository.count() > 0) {
            return jpaPackagingTaskRepository.findByStaffMember(staffMember);
        }
        return findAllFromFile().stream()
                .filter(t -> t.getStaffMember() != null && t.getStaffMember().trim().equalsIgnoreCase(staffMember != null ? staffMember.trim() : ""))
                .collect(Collectors.toList());
    }

    public PackagingTask save(PackagingTask task) {
        PackagingTask saved = task;
        if (saved.getCreatedAt() == null) {
            saved.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }

        if (jpaPackagingTaskRepository != null) {
            try {
                saved = jpaPackagingTaskRepository.saveAndFlush(saved);
            } catch (Exception e) {
                System.err.println("Database packaging task save warning: " + e.getMessage());
            }
        }

        lock.writeLock().lock();
        try {
            List<PackagingTask> list = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null && list.get(i).getId().equals(saved.getId())) {
                    list.set(i, saved);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                if (saved.getId() == null) {
                    long maxId = list.stream().mapToLong(t -> t.getId() != null ? t.getId() : 0L).max().orElse(0L);
                    saved.setId(maxId + 1);
                }
                list.add(saved);
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Error saving packaging task: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }

        return saved;
    }

    public List<PackagingTask> saveAll(List<PackagingTask> tasks) {
        List<PackagingTask> result = new ArrayList<>();
        for (PackagingTask t : tasks) {
            result.add(save(t));
        }
        return result;
    }

    public boolean deleteById(Long id) {
        if (jpaPackagingTaskRepository != null) {
            try {
                jpaPackagingTaskRepository.deleteById(id);
            } catch (Exception ignored) {}
        }

        lock.writeLock().lock();
        try {
            List<PackagingTask> list = findAllFromFile();
            boolean removed = list.removeIf(t -> t.getId() != null && t.getId().equals(id));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed;
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void deleteByOrderId(Long orderId) {
        if (jpaPackagingTaskRepository != null) {
            try {
                jpaPackagingTaskRepository.deleteByOrderId(orderId);
            } catch (Exception ignored) {}
        }

        lock.writeLock().lock();
        try {
            List<PackagingTask> list = findAllFromFile();
            boolean removed = list.removeIf(t -> t.getOrderId() != null && t.getOrderId().equals(orderId));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
        } catch (IOException e) {
            System.err.println("Error deleting tasks by orderId: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }
}
