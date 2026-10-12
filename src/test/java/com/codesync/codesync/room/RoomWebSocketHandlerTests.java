package com.codesync.codesync.room;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

class RoomWebSocketHandlerTests {

    @Test
    void relaysTextUpdatesOnlyToClientsInTheSameRoom() throws Exception {
        UUID sharedRoomId = UUID.randomUUID();
        UUID otherRoomId = UUID.randomUUID();
        RoomService roomService = mock(RoomService.class);
        when(roomService.resolveRoomId("SHARED1")).thenReturn(sharedRoomId);
        when(roomService.resolveRoomId("OTHER1")).thenReturn(otherRoomId);
        RoomWebSocketHandler handler = new RoomWebSocketHandler(roomService);

        WebSocketSession sender = session("sender", "/ws/rooms/SHARED1");
        WebSocketSession peer = session("peer", "/ws/rooms/SHARED1");
        WebSocketSession unrelatedClient = session("unrelated", "/ws/rooms/OTHER1");
        handler.afterConnectionEstablished(sender);
        handler.afterConnectionEstablished(peer);
        handler.afterConnectionEstablished(unrelatedClient);

        handler.handleMessage(sender, new TextMessage("update"));

        verify(sender).sendMessage(any(TextMessage.class));
        verify(peer).sendMessage(any(TextMessage.class));
        verify(unrelatedClient, never()).sendMessage(any());
    }

    @Test
    void rejectsUnknownRoomWithPolicyCloseStatus() throws Exception {
        RoomService roomService = mock(RoomService.class);
        when(roomService.resolveRoomId("MISSING")).thenThrow(new ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND,
                "Room not found"));
        RoomWebSocketHandler handler = new RoomWebSocketHandler(roomService);
        WebSocketSession session = session("unknown", "/ws/rooms/MISSING");

        handler.afterConnectionEstablished(session);

        verify(session).close(new CloseStatus(1008, "Unknown room"));
    }

    @Test
    void closesSessionOnTransportError() throws Exception {
        RoomWebSocketHandler handler = new RoomWebSocketHandler(mock(RoomService.class));
        WebSocketSession session = session("client", "/ws/rooms/SHARED1");

        handler.handleTransportError(session, new IllegalStateException("transport failed"));

        verify(session).close(CloseStatus.SERVER_ERROR);
    }

    private WebSocketSession session(String id, String path) {
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attributes = new HashMap<>();
        when(session.getId()).thenReturn(id);
        when(session.getUri()).thenReturn(URI.create(path));
        when(session.getAttributes()).thenReturn(attributes);
        when(session.isOpen()).thenReturn(true);
        return session;
    }
}
