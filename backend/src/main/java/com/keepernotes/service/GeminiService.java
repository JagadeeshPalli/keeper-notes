package com.keepernotes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.keepernotes.config.AppProperties;
import com.keepernotes.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private static final String GEMINI_BASE =
        "https://generativelanguage.googleapis.com/v1beta/models/";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;

    /**
     * Sends a prompt to Gemini and returns the text response.
     *
     * @param prompt  The full prompt to send
     * @param apiKey  The Gemini API key to use (system or user-supplied)
     * @return The generated text
     */
    public String generate(String prompt, String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AppException("AI_NOT_CONFIGURED", "AI is not configured. Please add your Gemini API key.", HttpStatus.SERVICE_UNAVAILABLE);
        }

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            )),
            "generationConfig", Map.of(
                "temperature", 0.6,
                "maxOutputTokens", 1024,
                // Disable thinking mode for fast responses on simple note tasks
                "thinkingConfig", Map.of("thinkingBudget", 0)
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String model = appProperties.getAi().getGeminiModel();
        String url = GEMINI_BASE + model + ":generateContent?key=" + apiKey;
        log.debug("Calling Gemini model: {}", model);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            return root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text")
                .asText()
                .trim();

        } catch (HttpClientErrorException e) {
            log.warn("Gemini API error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED || e.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new AppException("AI_KEY_INVALID", "Invalid Gemini API key.", HttpStatus.BAD_REQUEST);
            }
            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                throw new AppException("AI_QUOTA_EXCEEDED", "Gemini API quota exceeded. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
            }
            throw new AppException("AI_ERROR", "AI request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        } catch (Exception e) {
            log.error("Unexpected Gemini error", e);
            throw new AppException("AI_ERROR", "AI request failed. Please try again.", HttpStatus.BAD_GATEWAY);
        }
    }
}
