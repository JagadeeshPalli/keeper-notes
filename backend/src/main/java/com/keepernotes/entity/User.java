package com.keepernotes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    private String passwordHash;

    private String googleId;

    private String displayName;

    private String avatarUrl;

    /** Number of AI requests made using the system (free-tier) key */
    @Column(nullable = false)
    private int aiRequestsCount = 0;

    /** User's own Gemini API key — when set, bypasses the free-tier counter */
    @Column(length = 500)
    private String aiApiKey;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
