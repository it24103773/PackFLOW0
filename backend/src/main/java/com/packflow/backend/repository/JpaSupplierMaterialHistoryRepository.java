package com.packflow.backend.repository;

import com.packflow.backend.model.SupplierMaterialHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaSupplierMaterialHistoryRepository extends JpaRepository<SupplierMaterialHistory, Long> {
    List<SupplierMaterialHistory> findBySupplierId(Long supplierId);
    List<SupplierMaterialHistory> findBySupplierNameContainingIgnoreCaseOrMaterialNameContainingIgnoreCaseOrCategoryContainingIgnoreCase(String sName, String mName, String category);
}
