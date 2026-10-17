package com.packflow.backend.repository;

import com.packflow.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaPaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByCustomerEmailIgnoreCase(String customerEmail);
    List<Payment> findByOrderId(Long orderId);
    List<Payment> findByPaymentStatusIgnoreCase(String paymentStatus);
    List<Payment> findAllByOrderByTransactionDateDesc();
}
