package com.codesync.codesync.user;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codesync.codesync.security.JwtService;
import com.codesync.codesync.user.dto.LoginRequest;
import com.codesync.codesync.user.dto.LoginResponse;
import com.codesync.codesync.user.dto.SignupRequest;
import com.codesync.codesync.user.dto.UpdateUserRequest;
import com.codesync.codesync.user.dto.UserResponse;


@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User findByUsername(String username) {

        return userRepository.findByUsername(username);
    }

    public UserResponse saveUser(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())
                || userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username or email is already registered");
        }

        User user = new User();

        String pswdHash = passwordEncoder.encode(signupRequest.getPassword());

        user.setUsername(signupRequest.getUsername());
        user.setEmail(signupRequest.getEmail());
        user.setPasswordHash(pswdHash);

        User savedUser;
        try {
            savedUser = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username or email is already registered");
        }

        UserResponse userResponse = new UserResponse();
        userResponse.setId(savedUser.getId().toString());
        userResponse.setUsername(savedUser.getUsername());
        userResponse.setEmail(savedUser.getEmail());
        userResponse.setCreatedAt(savedUser.getCreatedAt().toString());
        return userResponse;
    }

    public LoginResponse loginUser(LoginRequest loginRequest) {

        User user = userRepository.findByUsername(loginRequest.getUsername());

        if (user != null
                && passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {

            String token = jwtService.generateToken(user.getId());

            UserResponse userResponse = new UserResponse();
            userResponse.setId(user.getId().toString());
            userResponse.setUsername(user.getUsername());
            userResponse.setEmail(user.getEmail());
            userResponse.setCreatedAt(user.getCreatedAt().toString());

            return new LoginResponse(token, "Bearer", userResponse);
        }

        return null;
    }

    public UserResponse updateUser(UUID id, UpdateUserRequest updatedUser) {

        User existingUser = userRepository.findById(id).orElse(null);

        if (existingUser != null) {
            existingUser.setUsername(updatedUser.getUsername());
            existingUser.setEmail(updatedUser.getEmail());
            existingUser.setPasswordHash(passwordEncoder.encode(updatedUser.getPasswordHash()));
            userRepository.save(existingUser);

            UserResponse userResponse = new UserResponse();
            userResponse.setId(existingUser.getId().toString());
            userResponse.setUsername(existingUser.getUsername());
            userResponse.setEmail(existingUser.getEmail());
            userResponse.setCreatedAt(existingUser.getCreatedAt().toString());

            return userResponse;
        }

        return null;
    }

}
