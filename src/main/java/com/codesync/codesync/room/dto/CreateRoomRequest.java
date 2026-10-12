package com.codesync.codesync.room.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateRoomRequest {

    @NotBlank(message = "Room name is required")
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
