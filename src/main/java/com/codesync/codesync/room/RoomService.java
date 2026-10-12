package com.codesync.codesync.room;

import java.security.SecureRandom;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codesync.codesync.room.dto.RoomResponse;
import com.codesync.codesync.user.User;
import com.codesync.codesync.user.UserRepository;

@Service
public class RoomService {

    private static final String ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int ROOM_CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public RoomService(RoomRepository roomRepository, UserRepository userRepository) {
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    public RoomResponse createRoom(String name) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User owner = null;
        if (authentication != null && authentication.getPrincipal() instanceof UUID authenticatedUserId) {
            owner = userRepository.findById(authenticatedUserId)
                    .orElseThrow(() -> new IllegalStateException("Authenticated user does not exist"));
        }

        for (int attempt = 0; attempt < 5; attempt++) {
            String code = generateUniqueCode();
            Room room = new Room();
            room.setCode(code);
            room.setName(name);
            room.setOwner(owner);

            try {
                return toRoomResponse(roomRepository.saveAndFlush(room));
            } catch (DataIntegrityViolationException exception) {
                if (!roomRepository.existsByCode(code)) {
                    throw exception;
                }
            }
        }

        throw new IllegalStateException("Could not generate a unique room code");
    }

    public RoomResponse getRoom(String roomCodeOrLegacyId) {
        return toRoomResponse(findRoom(roomCodeOrLegacyId));
    }

    public UUID resolveRoomId(String roomCodeOrLegacyId) {
        return findRoom(roomCodeOrLegacyId).getId();
    }

    public boolean roomExists(UUID roomId) {
        return roomRepository.existsById(roomId);
    }

    private Room findRoom(String roomCodeOrLegacyId) {
        Optional<Room> roomByCode = roomRepository.findByCode(roomCodeOrLegacyId);
        if (roomByCode.isPresent()) {
            return roomByCode.get();
        }

        try {
            UUID legacyId = UUID.fromString(roomCodeOrLegacyId);
            return roomRepository.findById(legacyId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found");
        }
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 100; attempt++) {
            StringBuilder code = new StringBuilder(ROOM_CODE_LENGTH);
            for (int index = 0; index < ROOM_CODE_LENGTH; index++) {
                code.append(ROOM_CODE_ALPHABET.charAt(RANDOM.nextInt(ROOM_CODE_ALPHABET.length())));
            }

            String candidate = code.toString();
            if (!roomRepository.existsByCode(candidate)) {
                return candidate;
            }
        }

        throw new IllegalStateException("Could not generate a unique room code");
    }

    private RoomResponse toRoomResponse(Room room) {
        RoomResponse response = new RoomResponse();
        response.setCode(room.getCode());
        response.setName(room.getName());
        if (room.getOwner() != null) {
            response.setOwnerUsername(room.getOwner().getUsername());
        }
        response.setCreatedAt(room.getCreatedAt().toString());

        return response;
    }
}
