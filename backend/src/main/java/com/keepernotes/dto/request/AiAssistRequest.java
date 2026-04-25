package com.keepernotes.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiAssistRequest {

    /** Raw HTML from the Tiptap editor — capped to prevent Gemini cost abuse (~15k words) */
    @NotBlank
    @Size(max = 20_000, message = "Content too large for AI processing (max 20,000 characters)")
    private String content;

    @Size(max = 500, message = "Title cannot exceed 500 characters")
    private String title;

    /** Strict whitelist — never forward an arbitrary string to the prompt builder */
    @NotBlank
    @Pattern(
        regexp = "^(summarize|grammar|labels|expand)$",
        message = "action must be one of: summarize, grammar, labels, expand"
    )
    private String action;
}
