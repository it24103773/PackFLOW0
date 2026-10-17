package com.packflow.backend.repository;

import com.packflow.backend.model.PackagingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaPackagingTaskRepository extends JpaRepository<PackagingTask, Long> {
    List<PackagingTask> findByOrderId(Long orderId);
    List<PackagingTask> findByOrderNumber(String orderNumber);
    List<PackagingTask> findByStaffMember(String staffMember);
    List<PackagingTask> findByOrderIdAndStatus(Long orderId, String status);
    List<PackagingTask> findByOrderIdAndStaffMember(Long orderId, String staffMember);
    List<PackagingTask> findByStatus(String status);
    void deleteByOrderId(Long orderId);
}
