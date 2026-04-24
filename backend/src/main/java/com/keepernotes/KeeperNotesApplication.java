package com.keepernotes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class KeeperNotesApplication {

    public static void main(String[] args) {
        SpringApplication.run(KeeperNotesApplication.class, args);
    }
}
