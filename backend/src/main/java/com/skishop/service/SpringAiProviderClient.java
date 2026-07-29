package com.skishop.service;

import com.skishop.config.AiProperties;

import java.util.Optional;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/**
 * Spring AI backed text generation adapter. Provider-specific HTTP details stay behind this boundary.
 */
@Component
public class SpringAiProviderClient implements AiProviderClient {

	private final ObjectProvider<ChatClient> chatClientProvider;
	private final AiProperties aiProperties;

	public SpringAiProviderClient(ObjectProvider<ChatClient> chatClientProvider, AiProperties aiProperties) {
		this.chatClientProvider = chatClientProvider;
		this.aiProperties = aiProperties;
	}

	@Override
	public Optional<String> generate(String prompt) {
		if (aiProperties.apiKey() == null || aiProperties.apiKey().isBlank()) {
			return Optional.empty();
		}
		ChatClient chatClient = chatClientProvider.getIfAvailable();
		if (chatClient == null) {
			return Optional.empty();
		}
		try {
			String answer = chatClient.prompt(prompt).call().content();
			return Optional.ofNullable(answer).filter(value -> !value.isBlank());
		} catch (RuntimeException exception) {
			throw new AiProviderException("AI provider call failed", exception);
		}
	}
}
