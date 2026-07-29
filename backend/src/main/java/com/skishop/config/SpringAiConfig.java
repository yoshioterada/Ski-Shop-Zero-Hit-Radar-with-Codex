package com.skishop.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Creates the Spring AI chat client only when an API key is configured.
 */
@Configuration
public class SpringAiConfig {

	/**
	 * Provides the primary live AI integration through Spring AI abstractions.
	 *
	 * @param aiProperties AI provider properties from environment variables
	 * @return chat client backed by an OpenAI-compatible Spring AI model
	 */
	@Bean
	@ConditionalOnMissingBean(ChatClient.class)
	@ConditionalOnExpression("!'${app.ai.api-key:}'.isBlank()")
	public ChatClient chatClient(AiProperties aiProperties) {
		OpenAiApi openAiApi = OpenAiApi.builder()
				.apiKey(aiProperties.apiKey())
				.build();
		OpenAiChatModel chatModel = OpenAiChatModel.builder()
				.openAiApi(openAiApi)
				.defaultOptions(OpenAiChatOptions.builder()
						.model(aiProperties.model())
						.build())
				.build();
		return ChatClient.create(chatModel);
	}
}
