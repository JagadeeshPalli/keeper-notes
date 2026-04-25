package com.keepernotes.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Ai ai = new Ai();
    private Storage storage = new Storage();
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
        /** Free-tier request cap per user (lifetime, unless they add their own key) */
        private int freeRequestLimit = 3;
    }

    @Data
    public static class Storage {
        private String r2AccountId = "";
        private String r2AccessKey = "";
        private String r2SecretKey = "";
        private String r2BucketName = "keepernotes-files";
        private String r2PublicUrl = "";
    }
}
