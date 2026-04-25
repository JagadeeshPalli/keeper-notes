package com.keepernotes.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class NoteRequest {

    @Size(max = 500, message = "Title cannot exceed 500 characters")
    private String title;

    /** HTML from Tiptap — cap at ~150 KB to prevent DB abuse */
    @Size(max = 150_000, message = "Note content cannot exceed 150,000 characters")
    private String content;

    /** Only the two known note types are valid */
    @Pattern(
        regexp = "^(text|checklist)$",
        message = "noteType must be 'text' or 'checklist'"
    )
    private String noteType;

    /** Whitelisted color keys matching the frontend NOTE_COLORS map */
    @Pattern(
        regexp = "^(default|red|orange|yellow|green|teal|blue|purple|pink|brown)$",
        message = "Invalid color value"
    )
    private String color;

    private List<UUID> labelIds;
}
