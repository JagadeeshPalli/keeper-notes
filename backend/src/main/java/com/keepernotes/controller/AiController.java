package com.keepernotes.controller;

import com.keepernotes.dto.request.AiAssistRequest;
import com.keepernotes.dto.request.SaveAiKeyRequest;
import com.keepernotes.dto.response.AiAssistResponse;
import com.keepernotes.dto.response.AiUsageResponse;
import com.keepernotes.dto.response.ApiResponse;
import com.keepernotes.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /** GET /api/ai/usage — returns free-tier usage stats for the current user */
    @GetMapping("/usage")
    public ResponseEntity<ApiResponse<AiUsageResponse>> getUsage(
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(aiService.getUsage(userId)));
    }

    /** POST /api/ai/assist — run an AI action on note content */
    @PostMapping("/assist")
    public ResponseEntity<ApiResponse<AiAssistResponse>> assist(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody AiAssistRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(aiService.assist(userId, req)));
    }

    /** POST /api/ai/key — save (or clear) the user's own Gemini API key */
    @PostMapping("/key")
    public ResponseEntity<ApiResponse<Void>> saveKey(
            @AuthenticationPrincipal UUID userId,
            @RequestBody SaveAiKeyRequest req) {
        aiService.saveApiKey(userId, req.getApiKey());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** DELETE /api/ai/key — remove the stored key (revert to free tier) */
    @DeleteMapping("/key")
    public ResponseEntity<ApiResponse<Void>> removeKey(
            @AuthenticationPrincipal UUID userId) {
        aiService.saveApiKey(userId, null);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
