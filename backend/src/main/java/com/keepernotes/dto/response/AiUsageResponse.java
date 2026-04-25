package com.keepernotes.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiUsageResponse {
    private int requestsUsed;
    private int requestsLimit;
    private boolean hasOwnKey;
}
