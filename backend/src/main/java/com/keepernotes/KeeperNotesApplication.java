package com.keepernotes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import com.keepernotes.config.AppProperties;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties(AppProperties.class)
public class KeeperNotesApplication {

    public static void main(String[] args) {
        SpringApplication.run(KeeperNotesApplication.class, args);
    }
}
