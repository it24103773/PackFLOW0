package com.packflow.backend.repository;

import com.packflow.backend.model.PackagingOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JpaOrderRepository extends JpaRepository<PackagingOrder, Long> {
    Optional<PackagingOrder> findByOrderNumber(String orderNumber);
}
