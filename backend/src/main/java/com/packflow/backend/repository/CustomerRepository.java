package com.packflow.backend.repository;

import com.packflow.backend.model.Customer;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository {
    List<Customer> findAll();
    Optional<Customer> findById(Long id);
    Optional<Customer> findByEmail(String email);
    Customer save(Customer customer);
    boolean deleteById(Long id);
    boolean deleteByEmail(String email);
    boolean existsByEmail(String email);
}
