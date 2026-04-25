package com.keepernotes.controller;

import com.keepernotes.dto.response.ApiResponse;
import com.keepernotes.dto.response.NoteImageResponse;
import com.keepernotes.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes/{noteId}/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    /**
     * POST /api/notes/{noteId}/images
     * Upload an image to a note. Accepts multipart/form-data with field "file".
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<NoteImageResponse>> upload(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID noteId,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (userId == null) throw com.keepernotes.exception.AppException.unauthorized("Authentication required");
        NoteImageResponse response = imageService.upload(userId, noteId, file);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * DELETE /api/notes/{noteId}/images/{imageId}
     * Remove an image from a note and delete from R2.
     */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID noteId,
            @PathVariable UUID imageId) {

        if (userId == null) throw com.keepernotes.exception.AppException.unauthorized("Authentication required");
        imageService.delete(userId, noteId, imageId);
        return ResponseEntity.noContent().build();
    }
}
