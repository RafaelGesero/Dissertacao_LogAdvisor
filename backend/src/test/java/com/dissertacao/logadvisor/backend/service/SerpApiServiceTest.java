package com.dissertacao.logadvisor.backend.service;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.dissertacao.logadvisor.backend.model.ArticleResult;

@ExtendWith(MockitoExtension.class)
class SerpApiServiceTest {

    @InjectMocks
    private SerpApiService serpApiService;

    private static final String SAMPLE_SERP_RESPONSE = """
            {
              "organic_results": [
                {
                  "title": "Secure Logging in Java Applications",
                  "link": "https://example.com/secure-logging",
                  "snippet": "Best practices for security logging in enterprise Java.",
                  "publication_info": {
                    "summary": "IEEE Security & Privacy, 2023"
                  }
                },
                {
                  "title": "GDPR-Compliant Log Management",
                  "link": "https://example.com/gdpr-logs",
                  "snippet": "How to handle personal data in application logs under GDPR.",
                  "publication_info": {
                    "summary": "ACM CCS, 2022"
                  }
                }
              ]
            }
            """;

    private static final String EMPTY_SERP_RESPONSE = """
            {
              "organic_results": []
            }
            """;

    private static final String NO_RESULTS_FIELD_RESPONSE = """
            {
              "search_metadata": {"status": "Success"}
            }
            """;

    @Test
    void searchArticles_shouldReturnParsedArticlesFromApi() {
        // TODO: SerpApiService uses RestClient internally which cannot be easily mocked with Mockito.
        //       Refactor SerpApiService to accept RestClient via constructor injection,
        //       then mock it here to return SAMPLE_SERP_RESPONSE.
        // TODO: inject a fake apiKey via ReflectionTestUtils.setField(serpApiService, "apiKey", "test-key")
        // TODO: call serpApiService.searchArticles("Java security logging")
        // TODO: assert returned list has 2 elements
        // TODO: assert first article title equals "Secure Logging in Java Applications"
        // TODO: assert first article publication equals "IEEE Security & Privacy, 2023"
    }

    @Test
    void searchArticles_whenApiReturnsEmptyResults_shouldReturnEmptyList() {
        // TODO: mock RestClient to return EMPTY_SERP_RESPONSE
        // TODO: assert returned list is empty
    }

    @Test
    void searchArticles_whenResponseHasNoOrganicResultsField_shouldReturnEmptyList() {
        // TODO: mock RestClient to return NO_RESULTS_FIELD_RESPONSE
        // TODO: assert returned list is empty (null check in parseResults handles this)
    }

    @Test
    void parseResults_shouldMapTitleLinkSnippetAndPublication() {
        // TODO: call searchArticles() with mocked HTTP response returning SAMPLE_SERP_RESPONSE
        // TODO: assert article.getTitle() is not blank
        // TODO: assert article.getLink() starts with "https://"
        // TODO: assert article.getSnippet() is not blank
        // TODO: assert article.getPublication() is not blank
    }

    @Test
    void parseResults_whenArticleHasNoPublicationInfo_shouldSetEmptyPublication() {
        // TODO: build a SERP response JSON where one article has no "publication_info" field
        // TODO: assert that article's publication is empty string (not null)
    }

    @Test
    void searchArticles_urlShouldContainEncodedQuery() {
        // TODO: capture the URI used by RestClient
        // TODO: assert it contains "engine=google_scholar"
        // TODO: assert it contains the URL-encoded query string
        // TODO: assert it contains "&num=20"
    }
}
