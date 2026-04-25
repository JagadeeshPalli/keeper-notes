package com.keepernotes.service;

import com.keepernotes.dto.response.NoteImageResponse;
import com.keepernotes.entity.Note;
import com.keepernotes.entity.NoteImage;
import com.keepernotes.exception.AppException;
import com.keepernotes.repository.NoteImageRepository;
import com.keepernotes.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageService {

    private static final long MAX_BYTES = 5L * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic");

    private final NoteRepository noteRepository;
    private final NoteImageRepository imageRepository;
    private final R2Service r2Service;

    @Transactional
    public NoteImageResponse upload(UUID userId, UUID noteId, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw AppException.badRequest("EMPTY_FILE", "File is empty");
        }
        if (file.getSize() > MAX_BYTES) {
            throw AppException.badRequest("FILE_TOO_LARGE", "File must be under 5 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw AppException.badRequest("INVALID_TYPE", "Only JPEG, PNG, GIF, WebP and HEIC are allowed");
        }

        Note note = noteRepository.findByIdWithLabels(noteId)
                .orElseThrow(() -> AppException.notFound("Note not found"));
        if (!note.getUser().getId().equals(userId)) {
            throw AppException.forbidden("You do not own this note");
        }

        String ext = extension(file.getOriginalFilename(), contentType);
        String key = "notes/" + noteId + "/" + UUID.randomUUID() + "." + ext;
        String url = r2Service.upload(key, file.getBytes(), contentType);

        NoteImage image = NoteImage.builder()
                .note(note)
                .url(url)
                .r2Key(key)
                .fileSize(file.getSize())
                .build();

        return NoteImageResponse.from(imageRepository.save(image));
    }

    @Transactional
    public void delete(UUID userId, UUID noteId, UUID imageId) {
        Note note = noteRepository.findByIdWithLabels(noteId)
                .orElseThrow(() -> AppException.notFound("Note not found"));
        if (!note.getUser().getId().equals(userId)) {
            throw AppException.forbidden("You do not own this note");
        }

        NoteImage image = imageRepository.findByIdAndNoteId(imageId, noteId)
                .orElseThrow(() -> AppException.notFound("Image not found"));

        r2Service.delete(image.getR2Key());
        imageRepository.delete(image);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String extension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        }
        return switch (contentType.toLowerCase()) {
            case "image/png"  -> "png";
            case "image/gif"  -> "gif";
            case "image/webp" -> "webp";
            case "image/heic" -> "heic";
            default           -> "jpg";
        };
    }
}
