package com.packflow.backend.repository;

import com.packflow.backend.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JpaSupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByEmailIgnoreCase(String email);
}
