package com.keepernotes.service;

import com.keepernotes.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Manages refresh token storage in Redis.
 * Key pattern: refresh:{token} -> userId
 */
@Service
@RequiredArgsConstructor
public class TokenService {

    private static final String PREFIX = "refresh:";

    private final StringRedisTemplate redis;
    private final AppProperties appProperties;

    public void storeRefreshToken(String token, UUID userId) {
        long ttlMs = appProperties.getJwt().getRefreshExpiryMs();
        redis.opsForValue().set(
                PREFIX + token,
                userId.toString(),
                Duration.ofMillis(ttlMs)
        );
    }

    public Optional<UUID> getUserIdFromRefreshToken(String token) {
        String value = redis.opsForValue().get(PREFIX + token);
        if (value == null) return Optional.empty();
        return Optional.of(UUID.fromString(value));
    }

    public void invalidateRefreshToken(String token) {
        redis.delete(PREFIX + token);
    }

    public boolean isRefreshTokenValid(String token) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX + token));
    }
}
