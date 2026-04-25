package com.keepernotes.dto.response;

import com.keepernotes.entity.NoteImage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NoteImageResponse {

    private UUID id;
    private String url;
    private Long fileSize;
    private LocalDateTime createdAt;

    public static NoteImageResponse from(NoteImage image) {
        return NoteImageResponse.builder()
                .id(image.getId())
                .url(image.getUrl())
                .fileSize(image.getFileSize())
                .createdAt(image.getCreatedAt())
                .build();
    }
}
