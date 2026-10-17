package com.packflow.backend.repository;

import com.packflow.backend.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaAnnouncementRepository extends JpaRepository<Announcement, Long> {
}
