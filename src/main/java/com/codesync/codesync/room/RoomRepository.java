package com.codesync.codesync.room;

import java.util.UUID;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    Optional<Room> findByCode(String code);

    boolean existsByCode(String code);
}
