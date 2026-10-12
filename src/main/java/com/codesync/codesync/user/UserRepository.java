package com.codesync.codesync.user;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {


    User findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

}
