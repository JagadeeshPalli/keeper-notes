package com.keepernotes.service;

import com.keepernotes.config.AppProperties;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;

/**
 * Wraps Cloudflare R2 object storage (S3-compatible).
 * Endpoint: https://{accountId}.r2.cloudflarestorage.com
 */
@Service
public class R2Service {

    private final S3Client s3;
    private final String bucketName;
    private final String publicUrl;

    public R2Service(AppProperties props) {
        AppProperties.Storage cfg = props.getStorage();
        this.bucketName = cfg.getR2BucketName();
        this.publicUrl = cfg.getR2PublicUrl();

        String endpoint = "https://" + cfg.getR2AccountId() + ".r2.cloudflarestorage.com";
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of("auto"))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(cfg.getR2AccessKey(), cfg.getR2SecretKey())))
                .build();
    }

    /**
     * Upload bytes to R2 and return the public URL.
     */
    public String upload(String key, byte[] data, String contentType) {
        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType != null ? contentType : "application/octet-stream")
                        .contentLength((long) data.length)
                        .build(),
                RequestBody.fromBytes(data));
        return publicUrl + "/" + key;
    }

    /**
     * Delete an object from R2 by its key.
     */
    public void delete(String key) {
        s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build());
    }
}
