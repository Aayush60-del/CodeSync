package com.codesync.codesync.user.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        UserResponse user) {
}