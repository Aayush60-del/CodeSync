package com.codesync.codesync.room;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RoomWebSocketHandler implements WebSocketHandler {

    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final RoomService roomService;

    public RoomWebSocketHandler(RoomService roomService) {
        this.roomService = roomService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        if (session.getUri() == null) {
            session.close(new CloseStatus(1008, "Room code is required"));
            return;
        }

        String path = session.getUri().getPath();
        String roomCode = path.substring(path.lastIndexOf("/") + 1);
        String roomId;
        try {
            UUID resolvedRoomId = roomService.resolveRoomId(roomCode);
            roomId = resolvedRoomId.toString();
        } catch (ResponseStatusException exception) {
            session.close(new CloseStatus(1008, "Unknown room"));
            return;
        }

        WebSocketSession safeSession = new ConcurrentWebSocketSessionDecorator(
                session,
                10_000,
                512 * 1024);

        safeSession.getAttributes().put("roomId", roomId);
        safeSession.getAttributes().put("safeSession", safeSession);
        rooms.computeIfAbsent(roomId, key -> ConcurrentHashMap.newKeySet())
                .add(safeSession);
    }

    @Override
    public void handleMessage(
            WebSocketSession session,
            org.springframework.web.socket.WebSocketMessage<?> message) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        if (roomId == null) {
            return;
        }

        Set<WebSocketSession> roomSessions = rooms.get(roomId);
        if (roomSessions == null) {
            return;
        }

        for (WebSocketSession client : roomSessions) {
            if (client.isOpen()) {
                if (message instanceof TextMessage textMessage) {
                    client.sendMessage(new TextMessage(textMessage.getPayload()));
                } else if (message instanceof BinaryMessage binaryMessage) {
                    client.sendMessage(new BinaryMessage(binaryMessage.getPayload().asReadOnlyBuffer()));
                }
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    public void afterConnectionClosed(
            WebSocketSession session,
            CloseStatus status) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");

        if (roomId == null) {
            return;
        }

        WebSocketSession safeSession = (WebSocketSession) session.getAttributes().get("safeSession");
        WebSocketSession sessionToRemove = safeSession == null ? session : safeSession;

        rooms.computeIfPresent(roomId, (key, roomSessions) -> {
            roomSessions.remove(sessionToRemove);

            if (roomSessions.isEmpty()) {
                return null;
            }

            return roomSessions;
        });
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}
