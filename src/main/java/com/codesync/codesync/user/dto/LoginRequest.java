package com.codesync.codesync.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;

public class LoginRequest {

    @NotBlank (message = "Username is required")
    private String username;

    @Size(min = 8, max = 15, message = "Password must be at least 8 characters long")
    @NotBlank (message = "Password is required")
    private String password;

    @Email(message = "Email should be valid")
    private String email;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    
}
