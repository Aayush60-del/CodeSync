package com.codesync.codesync.user;

import com.codesync.codesync.user.dto.LoginRequest;
import com.codesync.codesync.user.dto.LoginResponse;
import com.codesync.codesync.user.dto.SignupRequest;
import com.codesync.codesync.user.dto.UpdateUserRequest;
import com.codesync.codesync.user.dto.UserResponse;

import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/api/auth/signup")
    public ResponseEntity<UserResponse> signup(@Valid @RequestBody SignupRequest signupRequest) {
        UserResponse userResponse = userService.saveUser(signupRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse loginResponse = userService.loginUser(loginRequest);
        if (loginResponse != null) {
            return ResponseEntity.ok(loginResponse);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest updateUserRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UUID)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID authenticatedUserId = (UUID) authentication.getPrincipal();
        if (!authenticatedUserId.equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        UserResponse userResponse = userService.updateUser(id, updateUserRequest);
        if (userResponse != null) {
            return ResponseEntity.status(HttpStatus.OK).body(userResponse);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
