package com.keepernotes.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Ai ai = new Ai();
    private String frontendUrl = "http://localhost:3000";

    @Data
    public static class Jwt {
        private String secret;
        private long expiryMs = 86400000L;
        private long refreshExpiryMs = 604800000L;
    }

    @Data
    public static class Ai {
        private String geminiApiKey;
        private int rateLimitRequests = 10;
        private int rateLimitWindowHours = 1;
    }
}
