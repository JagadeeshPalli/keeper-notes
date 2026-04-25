package com.keepernotes.controller;

import com.keepernotes.dto.request.NoteRequest;
import com.keepernotes.dto.response.ApiResponse;
import com.keepernotes.dto.response.NoteResponse;
import com.keepernotes.exception.AppException;
import com.keepernotes.service.NoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@Tag(name = "Notes", description = "Create, read, update, delete, pin and archive notes")
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    @Operation(summary = "List active notes for the current user")
    public ResponseEntity<ApiResponse<List<NoteResponse>>> list(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID label
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(noteService.getActive(userId, search, label)));
    }

    @GetMapping("/archived")
    @Operation(summary = "List archived notes")
    public ResponseEntity<ApiResponse<List<NoteResponse>>> archived(@AuthenticationPrincipal UUID userId) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(noteService.getArchived(userId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single note by ID")
    public ResponseEntity<ApiResponse<NoteResponse>> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(noteService.getById(userId, id)));
    }

    @PostMapping
    @Operation(summary = "Create a new note")
    public ResponseEntity<ApiResponse<NoteResponse>> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody NoteRequest request
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        NoteResponse note = noteService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(note));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a note")
    public ResponseEntity<ApiResponse<NoteResponse>> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody NoteRequest request
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(noteService.update(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a note")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        noteService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Note deleted").build());
    }

    @PutMapping("/{id}/pin")
    @Operation(summary = "Toggle pin state")
    public ResponseEntity<ApiResponse<NoteResponse>> pin(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(noteService.togglePin(userId, id)));
    }

    @PutMapping("/{id}/archive")
    @Operation(summary = "Toggle archive state")
    public ResponseEntity<ApiResponse<NoteResponse>> archive(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(noteService.toggleArchive(userId, id)));
    }

    @PutMapping("/{id}/labels")
    @Operation(summary = "Set labels on a note")
    public ResponseEntity<ApiResponse<NoteResponse>> setLabels(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @RequestBody List<UUID> labelIds
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(noteService.setLabels(userId, id, labelIds)));
    }
}
