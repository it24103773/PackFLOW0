package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.StaffMember;
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
public class FileStaffMemberRepository {

    private final String filePath = "storage/staff.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaStaffMemberRepository jpaStaffMemberRepository;

    public FileStaffMemberRepository(@Lazy JpaStaffMemberRepository jpaStaffMemberRepository) {
        this.jpaStaffMemberRepository = jpaStaffMemberRepository;
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
                objectMapper.writeValue(file, createSeedStaff());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/staff.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<StaffMember> createSeedStaff() {
        List<StaffMember> list = new ArrayList<>();
        list.add(new StaffMember(1L, "EMP-1001", "Kasun Perera", "Die-Cutting Lead", "Plant Operations", "+94 77 123 4561", "kasun@packflow.com", "Day Shift (08:00 - 16:30)", "Active", "2026-01-10T08:00:00"));
        list.add(new StaffMember(2L, "EMP-1002", "Nimal Fernando", "Flexo Printing Specialist", "Pre-Press & Printing", "+94 77 123 4562", "nimal@packflow.com", "Day Shift (08:00 - 16:30)", "Active", "2026-01-10T08:00:00"));
        list.add(new StaffMember(3L, "EMP-1003", "Sunil Silva", "Quality Assurance Inspector", "Quality Assurance", "+94 77 123 4563", "sunil@packflow.com", "Day Shift (08:00 - 16:30)", "Active", "2026-01-10T08:00:00"));
        list.add(new StaffMember(4L, "EMP-1004", "Kamal Jayasinghe", "Assembly & Folding Lead", "Packaging Assembly", "+94 77 123 4564", "kamal@packflow.com", "Night Shift (16:30 - 01:00)", "Active", "2026-01-10T08:00:00"));
        list.add(new StaffMember(5L, "EMP-1005", "Ruwan Dissanayake", "Packaging Machine Operator", "Final Packaging", "+94 77 123 4565", "ruwan@packflow.com", "Rotational Shift", "Active", "2026-01-10T08:00:00"));
        return list;
    }

    public List<StaffMember> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(file, new TypeReference<List<StaffMember>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<StaffMember> findAll() {
        if (jpaStaffMemberRepository != null && jpaStaffMemberRepository.count() > 0) {
            return jpaStaffMemberRepository.findAll();
        }
        return findAllFromFile();
    }

    public Optional<StaffMember> findById(Long id) {
        if (jpaStaffMemberRepository != null && jpaStaffMemberRepository.count() > 0) {
            return jpaStaffMemberRepository.findById(id);
        }
        return findAllFromFile().stream().filter(s -> s.getId() != null && s.getId().equals(id)).findFirst();
    }

    public StaffMember save(StaffMember staff) {
        StaffMember savedStaff = staff;
        if (savedStaff.getCreatedAt() == null) {
            savedStaff.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (savedStaff.getStatus() == null) {
            savedStaff.setStatus("Active");
        }

        lock.writeLock().lock();
        try {
            List<StaffMember> list = findAllFromFile();
            boolean updated = false;
            long maxId = 0;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null) {
                    if (list.get(i).getId() > maxId) maxId = list.get(i).getId();
                    if (savedStaff.getId() != null && list.get(i).getId().equals(savedStaff.getId())) {
                        list.set(i, savedStaff);
                        updated = true;
                        break;
                    }
                }
            }
            if (!updated) {
                if (savedStaff.getId() == null) {
                    savedStaff.setId(maxId + 1);
                }
                if (savedStaff.getEmployeeId() == null || savedStaff.getEmployeeId().trim().isEmpty()) {
                    savedStaff.setEmployeeId("EMP-" + (1000 + savedStaff.getId()));
                }
                list.add(savedStaff);
            }

            if (jpaStaffMemberRepository != null) {
                try {
                    savedStaff = jpaStaffMemberRepository.save(savedStaff);
                } catch (Exception ignored) {}
            }

            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save staff member to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return savedStaff;
    }

    public boolean deleteById(Long id) {
        lock.writeLock().lock();
        try {
            List<StaffMember> list = findAllFromFile();
            boolean removed = list.removeIf(s -> s.getId() != null && s.getId().equals(id));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
                if (jpaStaffMemberRepository != null) {
                    try { jpaStaffMemberRepository.deleteById(id); } catch (Exception ignored) {}
                }
            }
            return removed;
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
