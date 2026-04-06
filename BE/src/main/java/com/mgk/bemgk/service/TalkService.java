package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.talk.TalkResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TalkService {

    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long INITIAL_BACKOFF_MILLIS = 1000L;
    private static final String FALLBACK_MESSAGE = "지금은 답변을 불러올 수 없어요. 잠시 후 다시 말씀해주세요.";
    private static final String SYSTEM_PROMPT = """
            당신은 MGK 앱의 음성 도우미다.
            사용자의 음성 입력을 이해하고, 고령 사용자가 이해하기 쉬운 짧은 한국어로 대답하라.
            답변은 2문장 이내로 유지하라.
            사용자가 재정, 건강, 지도, 상품 관련 질문을 하면 해당 기능을 쉽게 설명하라.
            사용자가 통장, 잔고, 계좌, 재정 관련 표현을 말하면 통장 화면에서 확인할 수 있다고 안내하라.
            모르는 내용은 추측하지 말고, 앱에서 도와줄 수 있는 범위만 안내하라.
            """;

    private final ChatModel chatModel;

    public TalkResponse ask(String transcript) {
        long backoffMillis = INITIAL_BACKOFF_MILLIS;

        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                String message = ChatClient.create(chatModel)
                        .prompt()
                        .system(SYSTEM_PROMPT)
                        .user(transcript)
                        .call()
                        .content();

                return new TalkResponse(message);
            } catch (RuntimeException exception) {
                log.warn("Gemini 호출 실패 - attempt={}/{}", attempt, MAX_RETRY_ATTEMPTS, exception);

                if (attempt == MAX_RETRY_ATTEMPTS) {
                    break;
                }

                sleep(backoffMillis);
                backoffMillis *= 2;
            }
        }

        return new TalkResponse(FALLBACK_MESSAGE);
    }

    private void sleep(long backoffMillis) {
        try {
            Thread.sleep(backoffMillis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("Gemini 재시도 대기 중 인터럽트가 발생했습니다.", exception);
        }
    }
}
