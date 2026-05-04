package com.dissertacao.logadvisor.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.dissertacao.logadvisor.backend.model.ArticleResult;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogAdvisorService {

    private final KnowledgeBaseService knowledgeBaseService;
    private final SerpApiService serpApiService;
    private final ChatLanguageModel chatLanguageModel;

    //ALTERAR ALGUMAS COISAS NA PARTE DOS ARTIGOS 
   public String getLoggingAdvice(String query) {
    List<EmbeddingMatch<TextSegment>> matches = knowledgeBaseService.search(query, 5);
    String articles_String;

    if (!matches.isEmpty()) {
        log.info("Foram encontrados os estes artigos na base de conhecimento {}", matches.size());
        articles_String = matches.stream()
                .map(match -> match.embedded().text())
                .filter(text -> text != null && !text.isBlank())
                .collect(Collectors.joining("\n\n---\n\n"));
    } else {
        log.info("Não foram encontrados nenhuns artigos na base, pesquisar com o SerpAPI");
        List<ArticleResult> articles = serpApiService.searchArticles(query);

        if (!articles.isEmpty()) {
            knowledgeBaseService.saveArticles(articles);
            log.info("Guardar os artigos {} na base de conhecimento", articles.size());
        }

        articles_String = articles.stream()
                .map(a -> "Title: " + a.getTitle() + "\nSnippet: " + a.getSnippet())
                .filter(text -> text != null && !text.isBlank())
                .collect(Collectors.joining("\n\n---\n\n"));
    }

    if (articles_String == null || articles_String.isBlank()) {
        articles_String = "Não foram encontrados artigos específicos. Responde com base no teu conhecimento geral.";
    }

    String prompt = """
            Taking into account only the following articles and the presented context, provide a specific 
            logging suggestion that can be used for the application, including which events should be logged and how to avoid exposing sensitive data.
            
            Articles:
            %s
            
            Context: %s

            """.formatted(articles_String, query);

    return chatLanguageModel.generate(prompt);
}
}