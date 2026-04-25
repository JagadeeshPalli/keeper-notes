package com.keepernotes.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    /** Public endpoint used by Render for health checks and uptime monitoring. */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "keeper-notes-backend"
        ));
    }
}
