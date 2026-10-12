package com.codesync.codesync.room;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import com.codesync.codesync.user.UserRepository;

class RoomServiceTests {

    private RoomRepository roomRepository;
    private RoomService roomService;

    @BeforeEach
    void setUp() {
        roomRepository = mock(RoomRepository.class);
        roomService = new RoomService(roomRepository, mock(UserRepository.class));
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createRoomGeneratesSixCharacterCodeAndKeepsGuestRoomUnowned() {
        when(roomRepository.existsByCode(org.mockito.ArgumentMatchers.anyString())).thenReturn(false);
        when(roomRepository.saveAndFlush(org.mockito.ArgumentMatchers.any(Room.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = roomService.createRoom("Pairing room");

        assertEquals(6, response.getCode().length());
        assertEquals("Pairing room", response.getName());
        assertNotNull(response.getCreatedAt());
        verify(roomRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(room -> room.getOwner() == null));
    }

    @Test
    void resolvesRoomByPublicCode() {
        UUID roomId = UUID.randomUUID();
        Room room = room(roomId, "AbC234", "Pairing room");
        when(roomRepository.findByCode("AbC234")).thenReturn(Optional.of(room));

        assertEquals(roomId, roomService.resolveRoomId("AbC234"));
    }

    @Test
    void resolvesLegacyUuidWhenNoCodeMatches() {
        UUID roomId = UUID.randomUUID();
        Room room = room(roomId, null, "Old room");
        when(roomRepository.findByCode(roomId.toString())).thenReturn(Optional.empty());
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        assertEquals(roomId, roomService.resolveRoomId(roomId.toString()));
    }

    @Test
    void unknownRoomReturnsNotFound() {
        when(roomRepository.findByCode("missing")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> roomService.getRoom("missing"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    private Room room(UUID id, String code, String name) {
        Room room = new Room() {
            @Override
            public UUID getId() {
                return id;
            }
        };
        room.setCode(code);
        room.setName(name);
        return room;
    }
}
