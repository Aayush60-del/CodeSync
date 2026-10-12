package com.codesync.codesync.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {  

    @NotBlank (message = "Username is required")
    private String username; 

    @Email(message = "Email should be valid") 
    private String email;  

    @Size(min = 8, max = 15, message = "Password must be at least 8 characters long")
    @NotBlank (message = "Password is required")
    private String passwordHash;  
  
    public String getUsername() {  
        return username;  
    }  
  
    public void setUsername(String username) {  
        this.username = username;  
    }  
  
    public String getEmail() {  
        return email;  
    }  
  
    public void setEmail(String email) {  
        this.email = email;  
    }  
  
    public String getPasswordHash() {  
        return passwordHash;  
    }  
  
    public void setPasswordHash(String passwordHash) {  
        this.passwordHash = passwordHash;  
    }

}