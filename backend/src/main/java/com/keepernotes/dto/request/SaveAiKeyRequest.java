package com.keepernotes.dto.request;

import lombok.Data;

@Data
public class SaveAiKeyRequest {
    private String apiKey; // null / blank → removes stored key
}
