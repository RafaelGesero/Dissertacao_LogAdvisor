package com.dissertacao.logadvisor.backend.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;

@Configuration
public class ChromaConfig {

    @Value("${groq.api-key}")
    private String groqApiKey;

    @Value("${groq.model}")
    private String groqModel;

    @Value("${chroma.url}")
    private String chromaUrl;

    @Value("${chroma.collection}")
    private String collection;

    @Bean
    public EmbeddingModel embeddingModel() {
        // Modelo de embedding local — gratuito, não precisa de API key
        return new AllMiniLmL6V2EmbeddingModel();
    }

    @Bean
public ChatLanguageModel chatLanguageModel() {
    return OpenAiChatModel.builder()
            .baseUrl("https://api.groq.com/openai/v1")
            .apiKey(groqApiKey)
            .modelName(groqModel)
            .timeout(Duration.ofSeconds(30))
            .build();
}

    @Bean
    public ChromaEmbeddingStore embeddingStore() {
        return ChromaEmbeddingStore.builder()
                .baseUrl(chromaUrl)
                .collectionName(collection)
                .build();
    }
}