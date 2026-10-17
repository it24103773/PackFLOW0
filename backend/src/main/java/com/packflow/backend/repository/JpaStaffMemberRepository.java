package com.packflow.backend.repository;

import com.packflow.backend.model.StaffMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JpaStaffMemberRepository extends JpaRepository<StaffMember, Long> {
    Optional<StaffMember> findByEmployeeId(String employeeId);
}
