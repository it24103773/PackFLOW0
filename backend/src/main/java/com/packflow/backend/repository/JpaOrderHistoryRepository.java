package com.packflow.backend.repository;

import com.packflow.backend.model.OrderHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaOrderHistoryRepository extends JpaRepository<OrderHistory, Long> {
    List<OrderHistory> findByOrderId(Long orderId);
    List<OrderHistory> findByCustomerEmail(String customerEmail);
}
