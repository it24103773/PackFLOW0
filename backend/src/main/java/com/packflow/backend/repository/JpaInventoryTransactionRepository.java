package com.packflow.backend.repository;

import com.packflow.backend.model.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaInventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByItemIdOrderByTimestampDesc(Long itemId);
    List<InventoryTransaction> findAllByOrderByTimestampDesc();
}
