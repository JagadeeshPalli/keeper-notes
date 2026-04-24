package com.keepernotes.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private T data;
    private String message;
    private ErrorBody error;

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorBody {
        private String code;
        private String message;
        private Map<String, String> fields;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().data(data).build();
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder().data(data).message(message).build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .error(ErrorBody.builder().code(code).message(message).build())
                .build();
    }

    public static <T> ApiResponse<T> validationError(Map<String, String> fields) {
        return ApiResponse.<T>builder()
                .error(ErrorBody.builder()
                        .code("VALIDATION_ERROR")
                        .fields(fields)
                        .build())
                .build();
    }
}
