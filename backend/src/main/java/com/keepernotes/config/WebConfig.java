package com.keepernotes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class WebConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    // NOTE: Do NOT define an ObjectMapper bean here.
    // Spring Boot auto-configures one with JavaTimeModule (JSR-310) and all
    // other sensible defaults via JacksonAutoConfiguration. Defining our own
    // would override that and break LocalDateTime serialisation across the app.
}
