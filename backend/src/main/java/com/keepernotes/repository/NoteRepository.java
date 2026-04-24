package com.keepernotes.repository;

import com.keepernotes.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    @Query("""
            SELECT n FROM Note n LEFT JOIN FETCH n.labels
            WHERE n.user.id = :userId
              AND n.archived = false
              AND n.deletedAt IS NULL
              AND (:search IS NULL
                   OR LOWER(n.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(n.content) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY n.pinned DESC, n.updatedAt DESC
            """)
    List<Note> findActive(@Param("userId") UUID userId, @Param("search") String search);

    @Query("""
            SELECT n FROM Note n LEFT JOIN FETCH n.labels
            WHERE n.user.id = :userId
              AND n.archived = true
              AND n.deletedAt IS NULL
            ORDER BY n.updatedAt DESC
            """)
    List<Note> findArchived(@Param("userId") UUID userId);

    @Query("""
            SELECT n FROM Note n LEFT JOIN FETCH n.labels l
            WHERE n.user.id = :userId
              AND n.archived = false
              AND n.deletedAt IS NULL
              AND l.id = :labelId
            ORDER BY n.pinned DESC, n.updatedAt DESC
            """)
    List<Note> findByLabel(@Param("userId") UUID userId, @Param("labelId") UUID labelId);

    @Query("SELECT n FROM Note n LEFT JOIN FETCH n.labels WHERE n.id = :id AND n.deletedAt IS NULL")
    Optional<Note> findByIdWithLabels(@Param("id") UUID id);

    @Query("SELECT COUNT(n) FROM Note n WHERE n.user.id = :userId AND n.deletedAt IS NULL AND n.archived = false")
    long countActiveByUserId(@Param("userId") UUID userId);
}
