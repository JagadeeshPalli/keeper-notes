package com.keepernotes.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LabelRequest {

    @NotBlank
    @Size(max = 50, message = "Label name cannot exceed 50 characters")
    private String name;

    private String color;
}
