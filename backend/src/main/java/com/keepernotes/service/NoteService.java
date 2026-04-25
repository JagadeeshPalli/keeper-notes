package com.keepernotes.service;

import com.keepernotes.dto.request.NoteRequest;
import com.keepernotes.dto.response.NoteResponse;
import com.keepernotes.entity.Label;
import com.keepernotes.entity.Note;
import com.keepernotes.entity.User;
import com.keepernotes.exception.AppException;
import com.keepernotes.repository.LabelRepository;
import com.keepernotes.repository.NoteRepository;
import com.keepernotes.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final LabelRepository labelRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NoteResponse> getActive(UUID userId, String search, UUID labelId) {
        if (labelId != null) {
            return noteRepository.findByLabel(userId, labelId)
                    .stream().map(NoteResponse::from).toList();
        }
        String q = StringUtils.hasText(search) ? search : null;
        return noteRepository.findActive(userId, q)
                .stream().map(NoteResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> getArchived(UUID userId) {
        return noteRepository.findArchived(userId)
                .stream().map(NoteResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse getById(UUID userId, UUID noteId) {
        Note note = findOwned(userId, noteId);
        return NoteResponse.from(note);
    }

    @Transactional
    public NoteResponse create(UUID userId, NoteRequest request) {
        User user = userRepository.getReferenceById(userId);
        Note note = Note.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .noteType(request.getNoteType() != null ? request.getNoteType() : "text")
                .color(request.getColor() != null ? request.getColor() : "default")
                .build();

        if (request.getLabelIds() != null && !request.getLabelIds().isEmpty()) {
            note.setLabels(resolveLabels(userId, request.getLabelIds()));
        }

        return NoteResponse.from(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse update(UUID userId, UUID noteId, NoteRequest request) {
        Note note = findOwned(userId, noteId);

        if (request.getTitle() != null) note.setTitle(request.getTitle());
        if (request.getContent() != null) note.setContent(request.getContent());
        if (request.getNoteType() != null) note.setNoteType(request.getNoteType());
        if (request.getColor() != null) note.setColor(request.getColor());
        if (request.getLabelIds() != null) {
            note.setLabels(resolveLabels(userId, request.getLabelIds()));
        }

        return NoteResponse.from(noteRepository.save(note));
    }

    @Transactional
    public void delete(UUID userId, UUID noteId) {
        Note note = findOwned(userId, noteId);
        note.setDeletedAt(LocalDateTime.now());
        noteRepository.save(note);
    }

    @Transactional
    public NoteResponse togglePin(UUID userId, UUID noteId) {
        Note note = findOwned(userId, noteId);
        note.setPinned(!note.isPinned());
        return NoteResponse.from(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse toggleArchive(UUID userId, UUID noteId) {
        Note note = findOwned(userId, noteId);
        note.setArchived(!note.isArchived());
        if (note.isArchived()) note.setPinned(false);
        return NoteResponse.from(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse setLabels(UUID userId, UUID noteId, List<UUID> labelIds) {
        Note note = findOwned(userId, noteId);
        note.setLabels(resolveLabels(userId, labelIds));
        return NoteResponse.from(noteRepository.save(note));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Note findOwned(UUID userId, UUID noteId) {
        Note note = noteRepository.findByIdWithLabels(noteId)
                .orElseThrow(() -> AppException.notFound("Note not found"));
        if (!note.getUser().getId().equals(userId)) {
            throw AppException.forbidden("You do not have access to this note");
        }
        return note;
    }

    private Set<Label> resolveLabels(UUID userId, List<UUID> labelIds) {
        Set<Label> labels = new HashSet<>();
        for (UUID labelId : labelIds) {
            Label label = labelRepository.findByIdAndUserId(labelId, userId)
                    .orElseThrow(() -> AppException.notFound("Label not found: " + labelId));
            labels.add(label);
        }
        return labels;
    }
}
