package com.keepernotes.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiAssistRequest {

    /** Raw HTML or plain text from the editor */
    @NotBlank
    private String content;

    private String title;

    /**
     * One of: summarize | grammar | labels | expand
     */
    @NotBlank
    private String action;
}
