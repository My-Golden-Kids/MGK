package com.mgk.bemgk.config;

import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class VisionConfig {

    @Bean
    public ImageAnnotatorClient imageAnnotatorClient(
            @Value("${google.vision.credentials-path:}") String credentialsPath
    ) throws IOException {
        GoogleCredentials credentials;

        if (StringUtils.hasText(credentialsPath)) {
            try (InputStream inputStream = new FileInputStream(credentialsPath)) {
                credentials = GoogleCredentials.fromStream(inputStream);
            }
        } else {
            credentials = GoogleCredentials.getApplicationDefault();
        }

        ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                .build();

        return ImageAnnotatorClient.create(settings);
    }
}
