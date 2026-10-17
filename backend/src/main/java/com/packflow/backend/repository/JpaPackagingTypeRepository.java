package com.packflow.backend.repository;

import com.packflow.backend.model.PackagingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaPackagingTypeRepository extends JpaRepository<PackagingType, Long> {
}
