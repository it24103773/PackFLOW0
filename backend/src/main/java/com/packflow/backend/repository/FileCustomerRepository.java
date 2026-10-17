package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.Customer;
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
public class FileCustomerRepository implements CustomerRepository {

    private final String filePath = "storage/customers.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaCustomerRepository jpaCustomerRepository;

    public FileCustomerRepository(@Lazy JpaCustomerRepository jpaCustomerRepository) {
        this.jpaCustomerRepository = jpaCustomerRepository;
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
                objectMapper.writeValue(file, createSeedCustomers());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/customers.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<Customer> createSeedCustomers() {
        List<Customer> customers = new ArrayList<>();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        customers.add(new Customer(1L, "Nimal Jayasinghe", "customer@packflow.com", "+1 (555) 876-1234", "REGISTERED", now, null, "123 Main St, Colombo", 2L));
        customers.add(new Customer(2L, "Malith Perera", "malith@gmail.com", "+1 (555) 654-9870", "REGISTERED", now, null, "45 Park Ave, Kandy", 1L));
        customers.add(new Customer(3L, "Kenula Herath", "kenula@gmail.com", "0718260611", "REGISTERED", now, null, "78 Galle Rd, Matara", 1L));
        customers.add(new Customer(4L, "Nimal Perera", "nimalnimal@gmail.com", "0777654845", "REGISTERED", now, null, "12 High St, Kurunegala", 0L));
        customers.add(new Customer(5L, "Mesandu Silva", "mesandu@gmail.com", "0701234567", "REGISTERED", now, null, "89 Station Rd, Negombo", 0L));
        customers.add(new Customer(6L, "Olini Manasha Weerawardhana", "olini@gmail.com", "0703457670", "REGISTERED", now, null, "56 Beach Rd, Bentota", 1L));
        customers.add(new Customer(7L, "Chamod Perera", "chamod@gmail.com", "0701234567", "REJECTED", now, "Order requirements do not align with system capabilities", "34 Temple Rd, Galle", 0L));
        customers.add(new Customer(8L, "Kasun Kalhara", "kasun@gmail.com", "0718245453", "REJECTED", now, "Order requirements do not align with system capabilities", "99 Lake Rd, Anuradhapura", 0L));

        return customers;
    }

    public List<Customer> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return createSeedCustomers();
            }
            return objectMapper.readValue(file, new TypeReference<List<Customer>>() {});
        } catch (IOException e) {
            System.err.println("Error reading customers from storage: " + e.getMessage());
            return createSeedCustomers();
        } finally {
            lock.readLock().unlock();
        }
    }

    @Override
    public List<Customer> findAll() {
        if (jpaCustomerRepository != null && jpaCustomerRepository.count() > 0) {
            return jpaCustomerRepository.findAll();
        }
        return findAllFromFile();
    }

    @Override
    public Optional<Customer> findById(Long id) {
        if (id == null) return Optional.empty();
        if (jpaCustomerRepository != null && jpaCustomerRepository.count() > 0) {
            return jpaCustomerRepository.findById(id);
        }
        return findAllFromFile().stream()
                .filter(c -> id.equals(c.getId()))
                .findFirst();
    }

    @Override
    public Optional<Customer> findByEmail(String email) {
        if (email == null) return Optional.empty();
        if (jpaCustomerRepository != null && jpaCustomerRepository.count() > 0) {
            return jpaCustomerRepository.findByEmailIgnoreCase(email.trim());
        }
        return findAllFromFile().stream()
                .filter(c -> c.getEmail() != null && c.getEmail().equalsIgnoreCase(email.trim()))
                .findFirst();
    }

    @Override
    public boolean existsByEmail(String email) {
        if (email == null) return false;
        if (jpaCustomerRepository != null && jpaCustomerRepository.count() > 0) {
            return jpaCustomerRepository.existsByEmailIgnoreCase(email.trim());
        }
        return findByEmail(email).isPresent();
    }

    @Override
    public Customer save(Customer customer) {
        Customer saved = customer;
        if (jpaCustomerRepository != null) {
            saved = jpaCustomerRepository.save(customer);
        }
        lock.writeLock().lock();
        try {
            List<Customer> customers = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < customers.size(); i++) {
                if (customers.get(i).getId() != null && customers.get(i).getId().equals(saved.getId())) {
                    customers.set(i, saved);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                if (saved.getId() == null) {
                    long maxId = customers.stream().mapToLong(c -> c.getId() != null ? c.getId() : 0L).max().orElse(0L);
                    saved.setId(maxId + 1);
                }
                customers.add(saved);
            }
            objectMapper.writeValue(new File(filePath), customers);
        } catch (IOException e) {
            System.err.println("Failed to persist customer to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return saved;
    }

    @Override
    public boolean deleteById(Long id) {
        if (id == null) return false;
        if (jpaCustomerRepository != null && jpaCustomerRepository.existsById(id)) {
            jpaCustomerRepository.deleteById(id);
        }
        lock.writeLock().lock();
        try {
            List<Customer> customers = findAllFromFile();
            boolean removed = customers.removeIf(c -> id.equals(c.getId()));
            if (removed) {
                objectMapper.writeValue(new File(filePath), customers);
            }
            return removed;
        } catch (IOException e) {
            System.err.println("Failed to remove customer from file backup: " + e.getMessage());
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }

    @Override
    public boolean deleteByEmail(String email) {
        if (email == null) return false;
        if (jpaCustomerRepository != null) {
            jpaCustomerRepository.deleteByEmailIgnoreCase(email.trim());
        }
        lock.writeLock().lock();
        try {
            List<Customer> customers = findAllFromFile();
            boolean removed = customers.removeIf(c -> c.getEmail() != null && c.getEmail().equalsIgnoreCase(email.trim()));
            if (removed) {
                objectMapper.writeValue(new File(filePath), customers);
            }
            return removed;
        } catch (IOException e) {
            System.err.println("Failed to remove customer by email from file backup: " + e.getMessage());
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
