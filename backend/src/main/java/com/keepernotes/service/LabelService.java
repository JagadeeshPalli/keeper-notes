package com.keepernotes.service;

import com.keepernotes.dto.request.LabelRequest;
import com.keepernotes.dto.response.LabelResponse;
import com.keepernotes.entity.Label;
import com.keepernotes.entity.User;
import com.keepernotes.exception.AppException;
import com.keepernotes.repository.LabelRepository;
import com.keepernotes.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LabelService {

    private final LabelRepository labelRepository;
    private final UserRepository userRepository;

    public List<LabelResponse> getAll(UUID userId) {
        return labelRepository.findByUserIdOrderByNameAsc(userId)
                .stream().map(LabelResponse::from).toList();
    }

    @Transactional
    public LabelResponse create(UUID userId, LabelRequest request) {
        if (labelRepository.existsByUserIdAndName(userId, request.getName().trim())) {
            throw AppException.conflict("LABEL_EXISTS", "A label with this name already exists");
        }
        User user = userRepository.getReferenceById(userId);
        Label label = Label.builder()
                .user(user)
                .name(request.getName().trim())
                .color(request.getColor() != null ? request.getColor() : "default")
                .build();
        return LabelResponse.from(labelRepository.save(label));
    }

    @Transactional
    public LabelResponse update(UUID userId, UUID labelId, LabelRequest request) {
        Label label = labelRepository.findByIdAndUserId(labelId, userId)
                .orElseThrow(() -> AppException.notFound("Label not found"));
        label.setName(request.getName().trim());
        if (request.getColor() != null) label.setColor(request.getColor());
        return LabelResponse.from(labelRepository.save(label));
    }

    @Transactional
    public void delete(UUID userId, UUID labelId) {
        Label label = labelRepository.findByIdAndUserId(labelId, userId)
                .orElseThrow(() -> AppException.notFound("Label not found"));
        labelRepository.delete(label);
    }
}
