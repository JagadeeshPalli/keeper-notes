package com.keepernotes.service;

import com.keepernotes.config.AppProperties;
import com.keepernotes.dto.request.AiAssistRequest;
import com.keepernotes.dto.response.AiAssistResponse;
import com.keepernotes.dto.response.AiUsageResponse;
import com.keepernotes.entity.User;
import com.keepernotes.exception.AppException;
import com.keepernotes.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final GeminiService geminiService;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    // ── Usage ─────────────────────────────────────────────────────────────────

    public AiUsageResponse getUsage(UUID userId) {
        User user = getUser(userId);
        int limit = appProperties.getAi().getFreeRequestLimit();
        return new AiUsageResponse(user.getAiRequestsCount(), limit, user.getAiApiKey() != null);
    }

    // ── Assist ────────────────────────────────────────────────────────────────

    @Transactional
    public AiAssistResponse assist(UUID userId, AiAssistRequest req) {
        User user = getUser(userId);
        int limit = appProperties.getAi().getFreeRequestLimit();
        boolean hasOwnKey = user.getAiApiKey() != null;

        // Determine which key to use
        String apiKey = hasOwnKey
            ? user.getAiApiKey()
            : appProperties.getAi().getGeminiApiKey();

        // Enforce free-tier cap when using system key
        if (!hasOwnKey && user.getAiRequestsCount() >= limit) {
            throw new AppException("AI_LIMIT_REACHED",
                "You've used all " + limit + " free AI credits. Add your own Gemini API key to continue.",
                HttpStatus.PAYMENT_REQUIRED);
        }

        String plainText = stripHtml(req.getContent());
        String prompt    = buildPrompt(req.getAction(), req.getTitle(), plainText);
        String result    = geminiService.generate(prompt, apiKey);

        // Increment counter only when using the system key
        int used = user.getAiRequestsCount();
        if (!hasOwnKey) {
            user.setAiRequestsCount(used + 1);
            userRepository.save(user);
            used = used + 1;
        }

        return AiAssistResponse.builder()
            .result(result)
            .action(req.getAction())
            .requestsUsed(hasOwnKey ? 0 : used)
            .requestsLimit(limit)
            .hasOwnKey(hasOwnKey)
            .build();
    }

    // ── API Key management ────────────────────────────────────────────────────

    @Transactional
    public void saveApiKey(UUID userId, String apiKey) {
        User user = getUser(userId);
        String trimmed = (apiKey == null || apiKey.isBlank()) ? null : apiKey.trim();

        // Validate the key by making a tiny test call
        if (trimmed != null) {
            geminiService.generate("Say OK in one word.", trimmed);
        }

        user.setAiApiKey(trimmed);
        userRepository.save(user);
    }

    // ── Prompts ───────────────────────────────────────────────────────────────

    private String buildPrompt(String action, String title, String text) {
        String context = (title != null && !title.isBlank())
            ? "Title: " + title + "\n\nContent:\n" + text
            : text;

        return switch (action) {
            case "summarize" -> """
                Summarize the following note in 2-3 concise sentences. \
                Return only the summary, no preamble.

                """ + context;

            case "grammar" -> """
                Fix grammar, spelling and punctuation in the following text. \
                Preserve the original meaning and tone. \
                Return only the corrected text, no explanation.

                """ + context;

            case "labels" -> """
                Suggest 3 to 5 short label tags for the following note. \
                Return ONLY a comma-separated list of lowercase single-word or hyphenated labels, nothing else. \
                Example format: work, ideas, follow-up

                """ + context;

            case "expand" -> """
                Expand the following note with more detail, examples and context \
                while keeping the same tone. \
                Return only the expanded text, no preamble.

                """ + context;

            default -> throw new AppException("AI_BAD_ACTION",
                "Unknown AI action: " + action, HttpStatus.BAD_REQUEST);
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new AppException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND));
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", " ")
                   .replaceAll("&nbsp;", " ")
                   .replaceAll("&amp;", "&")
                   .replaceAll("&lt;", "<")
                   .replaceAll("&gt;", ">")
                   .replaceAll("\\s{2,}", " ")
                   .trim();
    }
}
