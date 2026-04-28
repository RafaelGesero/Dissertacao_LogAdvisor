package com.dissertacao.logadvisor.backend.service;

import com.dissertacao.logadvisor.backend.model.ArticleResult;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogAdvisorService {

    private final KnowledgeBaseService knowledgeBaseService;
    private final SerpApiService serpApiService;
    private final ChatLanguageModel chatLanguageModel;

    public String getLoggingAdvice(String query) {

        // 1. Pesquisa na base de conhecimento
        List<EmbeddingMatch<TextSegment>> matches = knowledgeBaseService.search(query, 5);

        String context;

        if (!matches.isEmpty()) {
            log.info("Encontrados {} artigos relevantes na base de conhecimento", matches.size());
            context = matches.stream()
                    .map(match -> match.embedded().text())
                    .collect(Collectors.joining("\n\n---\n\n"));
        } else {
            // 2. Se não encontrou, pesquisa no SerpApi
            log.info("Nenhum artigo relevante, pesquisando no SerpApi...");
            List<ArticleResult> articles = serpApiService.searchArticles(query);

            if (!articles.isEmpty()) {
                knowledgeBaseService.saveArticles(articles);
                log.info("Guardados {} artigos na base de conhecimento", articles.size());
            }

            context = articles.stream()
                    .map(a -> "Title: " + a.getTitle() + "\nSnippet: " + a.getSnippet())
                    .collect(Collectors.joining("\n\n---\n\n"));
        }

        // 3. Gera resposta com o LLM usando o contexto dos artigos
        String prompt = """
                És um especialista em logging e segurança de software.
                Com base nos seguintes artigos académicos, responde à questão do utilizador.
                
                Artigos:
                %s
                
                Questão: %s
                
                Fornece sugestões específicas de logging para a aplicação descrita,
                incluindo que eventos devem ser registados e como evitar expor dados sensíveis.
                """.formatted(context, query);

        return chatLanguageModel.generate(prompt);
    }
}