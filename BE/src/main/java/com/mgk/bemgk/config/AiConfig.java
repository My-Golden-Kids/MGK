package com.mgk.bemgk.config;

import com.google.genai.Client;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.retry.RetryTemplate;

@Configuration
@RequiredArgsConstructor
public class AiConfig {

    @Value("AIzaSyCtga5hT8SokhIh8YxYPOFualxWKCwaYBI")
    private String apiKey;

    @Value("${spring.ai.google.genai.chat.options.model:gemini-2.5-flash}")
    private String model;

    @Value("${spring.ai.google.genai.chat.options.temperature:0.5}")
    private Double temperature;

    private final ToolCallingManager toolCallingManager;
    private final RetryTemplate retryTemplate;
    private final ObservationRegistry observationRegistry;

    @Bean
    public ChatModel chatModel() {
        Client genAiClient = Client.builder()
                .apiKey(apiKey)
                .vertexAI(false)
                .build();

        GoogleGenAiChatOptions defaultOptions = GoogleGenAiChatOptions.builder()
                .model(model)
                .temperature(temperature)
                .build();

        return GoogleGenAiChatModel.builder()
                .genAiClient(genAiClient)
                .defaultOptions(defaultOptions)
                .toolCallingManager(toolCallingManager)
                .retryTemplate(retryTemplate)
                .observationRegistry(observationRegistry)
                .build();
    }
}
