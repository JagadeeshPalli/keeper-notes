package com.keepernotes.dto.response;

import com.keepernotes.entity.Note;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class NoteResponse {

    private UUID id;
    private String title;
    private String content;
    private String noteType;
    private String color;
    private String detectedMood;
    private boolean pinned;
    private boolean archived;
    private List<LabelResponse> labels;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoteResponse from(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .noteType(note.getNoteType())
                .color(note.getManualColor() != null ? note.getManualColor() : note.getColor())
                .detectedMood(note.getDetectedMood())
                .pinned(note.isPinned())
                .archived(note.isArchived())
                .labels(note.getLabels().stream()
                        .map(LabelResponse::from)
                        .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                        .toList())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
