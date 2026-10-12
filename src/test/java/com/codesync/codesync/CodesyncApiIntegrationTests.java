package com.codesync.codesync;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
        "spring.jpa.show-sql=false",
        "logging.level.org.springframework=ERROR"
})
@AutoConfigureMockMvc
@Transactional
class CodesyncApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void signsUpAndAuthenticatesUserWithoutReturningPasswordHash() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"test-user","email":"test-user@example.com","password":"password1"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("test-user"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"test-user","password":"password1"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"test-user","password":"incorrect1"}
                        """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsDuplicateSignupWithConflict() throws Exception {
        String signupBody = """
                {"username":"duplicate-user","email":"duplicate@example.com","password":"password1"}
                """;

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupBody))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupBody))
                .andExpect(status().isConflict());
    }

    @Test
    void createsAndReadsPublicRoomInvite() throws Exception {
        String response = mockMvc.perform(post("/api/rooms")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Integration room"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Integration room"))
                .andExpect(jsonPath("$.code").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String roomCode = com.fasterxml.jackson.databind.json.JsonMapper.builder()
                .build()
                .readTree(response)
                .get("code")
                .asText();

        mockMvc.perform(get("/api/rooms/{roomCode}", roomCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(roomCode))
                .andExpect(jsonPath("$.name").value("Integration room"));
    }

    @Test
    void unknownRoomReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/rooms/{roomCode}", "missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Room not found"));
    }

    @Test
    void profileUpdateRequiresAuthentication() throws Exception {
        mockMvc.perform(put("/api/users/{id}", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"updated","email":"updated@example.com","passwordHash":"password1"}
                        """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsInvalidSignupLoginAndRoomRequests() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"","email":"invalid","password":"short"}
                        """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"","password":""}
                        """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/rooms")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"  "}
                        """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void validTokenCanOnlyUpdateItsOwnersProfile() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"owner-user","email":"owner-user@example.com","password":"password1"}
                        """))
                .andExpect(status().isCreated());

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"owner-user","password":"password1"}
                        """))
                .andExpect(status().isOk())
                .andReturn();

        var loginResponse = com.fasterxml.jackson.databind.json.JsonMapper.builder()
                .build()
                .readTree(login.getResponse().getContentAsString());
        String userId = loginResponse.get("user").get("id").asText();
        String accessToken = loginResponse.get("accessToken").asText();
        String updateBody = """
                {"username":"owner-updated","email":"owner-updated@example.com","passwordHash":"password2"}
                """;

        mockMvc.perform(put("/api/users/{id}", userId)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("owner-updated"));

        mockMvc.perform(put("/api/users/{id}", UUID.randomUUID())
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateBody))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/users/{id}", userId)
                .header("Authorization", "Bearer " + accessToken + "x"))
                .andExpect(status().isUnauthorized());
    }
}
