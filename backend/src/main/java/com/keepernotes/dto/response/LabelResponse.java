package com.keepernotes.dto.response;

import com.keepernotes.entity.Label;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class LabelResponse {

    private UUID id;
    private String name;
    private String color;

    public static LabelResponse from(Label label) {
        return LabelResponse.builder()
                .id(label.getId())
                .name(label.getName())
                .color(label.getColor())
                .build();
    }
}
