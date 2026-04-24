package com.keepernotes.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class NoteRequest {

    @Size(max = 500, message = "Title cannot exceed 500 characters")
    private String title;

    private String content;

    private String noteType;

    private String color;

    private List<UUID> labelIds;
}
