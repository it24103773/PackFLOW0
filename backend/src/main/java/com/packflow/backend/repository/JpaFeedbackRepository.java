package com.packflow.backend.repository;

import com.packflow.backend.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaFeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByCustomerEmail(String customerEmail);
}
