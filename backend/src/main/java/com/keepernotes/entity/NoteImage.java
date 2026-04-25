package com.keepernotes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "note_images")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Note note;

    @Column(nullable = false)
    private String url;

    @Column(name = "r2_key")
    private String r2Key;

    @Column(name = "file_size")
    private Long fileSize;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
