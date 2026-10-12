package com.codesync.codesync.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class JwtServiceTests {

    private static final String SECRET = "werfheogaehrglkflsdgkhaiSga342576dsfasobsg";

    @Test
    void generatesAndValidatesTokenForUser() {
        JwtService jwtService = new JwtService(SECRET, 60_000);
        UUID userId = UUID.randomUUID();

        String token = jwtService.generateToken(userId);

        assertTrue(jwtService.validateToken(token));
        assertEquals(userId, jwtService.extractUserId(token));
    }

    @Test
    void rejectsTamperedAndExpiredTokens() throws InterruptedException {
        JwtService jwtService = new JwtService(SECRET, 1);
        String token = jwtService.generateToken(UUID.randomUUID());
        Thread.sleep(10);

        assertFalse(jwtService.validateToken(token));
        assertFalse(new JwtService(SECRET, 60_000).validateToken(token + "x"));
    }
}
