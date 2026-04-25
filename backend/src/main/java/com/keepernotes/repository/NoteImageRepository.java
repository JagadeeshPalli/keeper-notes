package com.keepernotes.repository;

import com.keepernotes.entity.NoteImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NoteImageRepository extends JpaRepository<NoteImage, UUID> {

    Optional<NoteImage> findByIdAndNoteId(UUID id, UUID noteId);
}
