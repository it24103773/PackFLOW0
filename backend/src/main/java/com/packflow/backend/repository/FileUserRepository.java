package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.User;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class FileUserRepository implements UserRepository {

    private final String filePath = "storage/users.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JpaUserRepository jpaUserRepository;

    public FileUserRepository(@Lazy JpaUserRepository jpaUserRepository) {
        this.jpaUserRepository = jpaUserRepository;
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
                
                // Seed initial default stakeholders with default password '12345678'
                List<User> initialUsers = createSeedUsers();
                objectMapper.writeValue(file, initialUsers);
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/users.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<User> createSeedUsers() {
        List<User> users = new ArrayList<>();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String defaultPassword = "12345678";

        // 1. System Administrator (senuraperera@packflow.com & senuraperera@packflowcom)
        users.add(new User(1L, "Senura Perera", "senuraperera@packflow.com", defaultPassword, "System Administrator", "+1 (555) 234-5678", "26/11 Gonamaditha Road, Piliyandala, Sri Lanka", "REGISTERED", now));
        users.add(new User(2L, "Senura Perera", "senuraperera@packflowcom", defaultPassword, "System Administrator", "+1 (555) 987-6543", "26/11 Gonamaditha Road, Piliyandala, Sri Lanka", "REGISTERED", now));

        // 2. Inventory Manager (bihanbihan@packflow.com)
        users.add(new User(3L, "Bihan Silva", "bihanbihan@packflow.com", defaultPassword, "Inventory Manager", "+1 (555) 432-1098", "45 Warehouse Rd, Colombo", "REGISTERED", now));

        // 3. Packaging Manager (damsakdamsak@packflow.com)
        users.add(new User(4L, "Damsak Perera", "damsakdamsak@packflow.com", defaultPassword, "Packaging Manager", "+1 (555) 765-4321", "12 Plant St, Colombo", "REGISTERED", now));

        // 4. Supplier (yuthma@packflow.com)
        users.add(new User(5L, "Yuthma Global Materials", "yuthma@packflow.com", defaultPassword, "Supplier", "+1 (555) 321-8765", "88 Industrial Hub, Kandy", "REGISTERED", now));

        // 5. Default Customer
        users.add(new User(6L, "Nimal Jayasinghe", "customer@packflow.com", defaultPassword, "Customer", "+1 (555) 876-1234", "123 Main St, Colombo", "REGISTERED", now));

        return users;
    }

    public List<User> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return createSeedUsers();
            }
            return objectMapper.readValue(file, new TypeReference<List<User>>() {});
        } catch (IOException e) {
            System.err.println("Error reading users from storage: " + e.getMessage());
            return createSeedUsers();
        } finally {
            lock.readLock().unlock();
        }
    }

    @Override
    public List<User> findAll() {
        if (jpaUserRepository != null && jpaUserRepository.count() > 0) {
            return jpaUserRepository.findAll();
        }
        return findAllFromFile();
    }

    @Override
    public Optional<User> findById(Long id) {
        if (jpaUserRepository != null && jpaUserRepository.count() > 0) {
            return jpaUserRepository.findById(id);
        }
        return findAllFromFile().stream()
                .filter(user -> user.getId() != null && user.getId().equals(id))
                .findFirst();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        if (email == null) return Optional.empty();
        if (jpaUserRepository != null && jpaUserRepository.count() > 0) {
            return jpaUserRepository.findByEmailIgnoreCase(email.trim());
        }
        return findAllFromFile().stream()
                .filter(user -> user.getEmail() != null && user.getEmail().equalsIgnoreCase(email.trim()))
                .findFirst();
    }

    @Override
    public boolean existsByEmail(String email) {
        if (email == null) return false;
        if (jpaUserRepository != null && jpaUserRepository.count() > 0) {
            return jpaUserRepository.existsByEmailIgnoreCase(email.trim());
        }
        return findByEmail(email).isPresent();
    }

    @Override
    public User save(User user) {
        User savedUser = user;
        if (jpaUserRepository != null) {
            savedUser = jpaUserRepository.save(user);
        }
        lock.writeLock().lock();
        try {
            List<User> users = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < users.size(); i++) {
                if (users.get(i).getId() != null && users.get(i).getId().equals(savedUser.getId())) {
                    users.set(i, savedUser);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                users.add(savedUser);
            }
            objectMapper.writeValue(new File(filePath), users);
        } catch (IOException e) {
            System.err.println("Failed to persist user to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return savedUser;
    }
}
