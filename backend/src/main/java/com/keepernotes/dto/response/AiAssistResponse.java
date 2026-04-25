package com.keepernotes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAssistResponse {
    private String result;
    private String action;
    private int requestsUsed;
    private int requestsLimit;
    private boolean hasOwnKey;
}
