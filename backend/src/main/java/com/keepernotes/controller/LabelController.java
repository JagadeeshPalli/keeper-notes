package com.keepernotes.controller;

import com.keepernotes.dto.request.LabelRequest;
import com.keepernotes.dto.response.ApiResponse;
import com.keepernotes.dto.response.LabelResponse;
import com.keepernotes.exception.AppException;
import com.keepernotes.service.LabelService;
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
@RequestMapping("/api/labels")
@RequiredArgsConstructor
@Tag(name = "Labels", description = "Create and manage note labels")
public class LabelController {

    private final LabelService labelService;

    @GetMapping
    @Operation(summary = "List all labels for the current user")
    public ResponseEntity<ApiResponse<List<LabelResponse>>> list(@AuthenticationPrincipal UUID userId) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(labelService.getAll(userId)));
    }

    @PostMapping
    @Operation(summary = "Create a new label")
    public ResponseEntity<ApiResponse<LabelResponse>> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody LabelRequest request
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(labelService.create(userId, request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a label")
    public ResponseEntity<ApiResponse<LabelResponse>> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody LabelRequest request
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        return ResponseEntity.ok(ApiResponse.ok(labelService.update(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a label")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        if (userId == null) throw AppException.unauthorized("Authentication required");
        labelService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Label deleted").build());
    }
}
