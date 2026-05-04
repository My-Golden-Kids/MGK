package com.mgk.bemgk.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.HexFormat;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.talk.TalkResponse;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetWalkRecord;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;
import com.mgk.bemgk.repository.PetWalkRecordRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TalkService {

	private static final int MAX_RETRY_ATTEMPTS = 3;
	private static final long INITIAL_BACKOFF_MILLIS = 1000L;
	private static final Duration TALK_CACHE_TTL = Duration.ofMinutes(5);
	private static final String FALLBACK_MESSAGE = "지금은 답변을 불러올 수 없어요. 잠시 후 다시 말씀해주세요.";
	private static final String NO_PET_MESSAGE = "먼저 반려동물을 선택해 주세요.";
	private static final String SYSTEM_PROMPT = """
		너는 MGK 앱의 음성 도우미다. 사용자의 음성 입력을 이해하고 고령 사용자가 이해하기 쉬운 답변은 2문장 이내로 짧은 한국어로 대답해.
		사용자가 재정, 건강, 지도, 상품 관련 질문을 하면 해당 기능을 쉽게 설명해 또한 화면에서 확인할 수 있다고 안내해.
		모르는 내용은 추측하지 말고 앱에서 도와줄 수 있는 범위만 안내해.
		""";

	private final ChatModel chatModel;
	private final CurrentUserService currentUserService;
	private final PetRepository petRepository;
	private final MedicalDocumentRepository medicalDocumentRepository;
	private final PetWalkRecordRepository petWalkRecordRepository;
	private final AverageMedicalCostService averageMedicalCostService;
	private final FutureMedicalCostService futureMedicalCostService;
	private final StringRedisTemplate stringRedisTemplate;

	public TalkResponse ask(String transcript, Long petId) {
		String safeTranscript = transcript == null ? "" : transcript.trim();
		if (safeTranscript.isBlank()) {
			return new TalkResponse(FALLBACK_MESSAGE);
		}

		Long userId = currentUserService.getCurrentUserId();
		boolean cacheableShortQuestion = isCacheableShortQuestion(safeTranscript);
		String cacheKey = cacheableShortQuestion ? buildTalkCacheKey(userId, petId, safeTranscript) : null;
		String normalizedTranscript = safeTranscript.replaceAll(" ", "");

		if (averageMedicalCostService.isAverageCostQuery(safeTranscript)) {
			return answerAverageMedicalCostQuery(petId, safeTranscript);
		}

		if (futureMedicalCostService.isFutureMedicalCostQuery(safeTranscript)) {
			return answerFutureMedicalCostQuery(petId);
		}

		if (isWalkQuery(normalizedTranscript)) {
			return answerWalkQuery(petId);
		}

		if (isVaccinationQuery(normalizedTranscript)) {
			return answerMedicalQuery(petId, MedicalDocumentType.VACCINATION);
		}

		if (isMedicalQuery(normalizedTranscript)) {
			return answerMedicalQuery(petId, null);
		}

		if (cacheableShortQuestion) {
			String cachedResponse = readTalkCache(cacheKey);
			if (cachedResponse != null) {
				return new TalkResponse(cachedResponse);
			}
		}

		long backoffMillis = INITIAL_BACKOFF_MILLIS;

		for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
			try {
				String message = ChatClient.create(chatModel)
					.prompt()
					.system(SYSTEM_PROMPT)
					.user(safeTranscript)
					.call()
					.content();

				if (cacheableShortQuestion) {
					writeTalkCache(cacheKey, message);
				}

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

	private boolean isCacheableShortQuestion(String transcript) {
		if (transcript.length() > 30) {
			return false;
		}

		return !transcript.matches(".*\\d.*");
	}

	private String buildTalkCacheKey(Long userId, Long petId, String transcript) {
		return "talk:v1:%d:%s:%s".formatted(
			userId,
			petId == null ? "none" : petId.toString(),
			sha256(transcript)
		);
	}

	private String sha256(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (Exception exception) {
			throw new IllegalStateException("Talk cache key hash 생성에 실패했습니다.", exception);
		}
	}

	private String readTalkCache(String cacheKey) {
		try {
			return stringRedisTemplate.opsForValue().get(cacheKey);
		} catch (RuntimeException exception) {
			log.warn("Redis talk cache read failed", exception);
			return null;
		}
	}

	private void writeTalkCache(String cacheKey, String message) {
		try {
			stringRedisTemplate.opsForValue().set(cacheKey, message, TALK_CACHE_TTL);
		} catch (RuntimeException exception) {
			log.warn("Redis talk cache write failed", exception);
		}
	}

	private TalkResponse answerAverageMedicalCostQuery(Long petId, String transcript) {
		try {
			return new TalkResponse(averageMedicalCostService.answer(petId, transcript));
		} catch (ResponseStatusException exception) {
			String reason = exception.getReason();

			if (reason != null && !reason.isBlank()) {
				return new TalkResponse(reason);
			}

			return new TalkResponse("평균 진료비 정보를 찾을 수 없어요.");
		}
	}

	private TalkResponse answerFutureMedicalCostQuery(Long petId) {
		try {
			return new TalkResponse(futureMedicalCostService.answer(petId));
		} catch (ResponseStatusException exception) {
			String reason = exception.getReason();

			if (reason != null && !reason.isBlank()) {
				return new TalkResponse(reason);
			}

			return new TalkResponse("미래 병원비 예측 정보를 준비할 수 없어요.");
		}
	}

	private boolean isWalkQuery(String transcript) {
		return transcript.contains("산책")
			&& (transcript.contains("오늘")
			|| transcript.contains("했나")
			|| transcript.contains("했어")
			|| transcript.contains("했지")
			|| transcript.contains("기록"));
	}

	private boolean isVaccinationQuery(String transcript) {
		return (transcript.contains("접종")
			|| transcript.contains("예방접종")
			|| transcript.contains("백신"))
			&& (transcript.contains("언제")
			|| transcript.contains("했나")
			|| transcript.contains("했어")
			|| transcript.contains("기록"));
	}

	private boolean isMedicalQuery(String transcript) {
		return (transcript.contains("병원")
			|| transcript.contains("검진")
			|| transcript.contains("진료"))
			&& (transcript.contains("언제")
			|| transcript.contains("갔지")
			|| transcript.contains("기록")
			|| transcript.contains("얼마"));
	}

	private TalkResponse answerWalkQuery(Long petId) {
		Pet pet = resolvePet(petId);

		if (pet == null) {
			return new TalkResponse(NO_PET_MESSAGE);
		}

		LocalDate today = LocalDate.now();
		LocalDateTime startAt = today.atStartOfDay();
		LocalDateTime endAt = startAt.plusDays(1);

		return petWalkRecordRepository
			.findFirstByPet_IdAndCompletedTrueAndWalkedAtBetweenOrderByWalkedAtDesc(
				pet.getId(),
				startAt,
				endAt
			)
			.map(record -> new TalkResponse(buildWalkAnswer(pet, record)))
			.orElseGet(() -> new TalkResponse(
				"%s는 오늘 아직 산책 기록이 없어요.".formatted(pet.getName())
			));
	}

	private TalkResponse answerMedicalQuery(Long petId, MedicalDocumentType type) {
		Pet pet = resolvePet(petId);

		if (pet == null) {
			return new TalkResponse(NO_PET_MESSAGE);
		}

		List<MedicalDocument> documents = type == null
			? medicalDocumentRepository.findByPet_IdOrderByDateDescCreatedAtDesc(pet.getId())
			: medicalDocumentRepository.findByPet_IdAndTypeOrderByDateDescCreatedAtDesc(pet.getId(), type);

		if (documents.isEmpty()) {
			return new TalkResponse(
				type == MedicalDocumentType.VACCINATION
					? "%s의 예방접종 기록이 아직 없어요.".formatted(pet.getName())
					: "%s의 병원 기록이 아직 없어요.".formatted(pet.getName())
			);
		}

		MedicalDocument latestDocument = documents.get(0);
		return new TalkResponse(buildMedicalAnswer(pet, latestDocument));
	}

	private Pet resolvePet(Long petId) {
		Long userId = currentUserService.getCurrentUserId();

		if (petId != null) {
			return petRepository.findByIdAndUser_Id(petId, userId)
				.filter(pet -> !pet.isDead())
				.orElse(null);
		}

		return petRepository.findByUser_Id(userId).stream()
			.filter(pet -> !pet.isDead())
			.findFirst()
			.orElse(null);
	}

	private String buildWalkAnswer(Pet pet, PetWalkRecord record) {
		int minutes = Math.max(1, record.getWalkTimeSeconds() / 60);

		return "%s는 오늘 산책했어요. 총 %d분 걸었고 %d보였어요."
			.formatted(pet.getName(), minutes, record.getStepCount());
	}

	private String buildMedicalAnswer(Pet pet, MedicalDocument document) {
		String visitType = document.getType() == MedicalDocumentType.VACCINATION ? "예방접종" : "건강검진";
		String dateText = document.getDate() == null
			? "날짜 정보가 없어요"
			: "%d월 %d일".formatted(document.getDate().getMonthValue(), document.getDate().getDayOfMonth());
		String hospitalName = document.getHospitalName() == null || document.getHospitalName().isBlank()
			? "병원 이름 정보가 없어요"
			: document.getHospitalName();

		if (document.getTotalAmount() != null) {
			int amountInTenThousandWon = document.getTotalAmount() / 10000;
			if (amountInTenThousandWon > 0) {
				return "%s는 %s에 %s에서 %s으로 방문했어요. 비용은 %d만원이었어요."
					.formatted(pet.getName(), dateText, hospitalName, visitType, amountInTenThousandWon);
			}

			return "%s는 %s에 %s에서 %s으로 방문했어요. 비용은 %s원이었어요."
				.formatted(pet.getName(), dateText, hospitalName, visitType, document.getTotalAmount());
		}

		return "%s는 %s에 %s에서 %s으로 방문했어요."
			.formatted(pet.getName(), dateText, hospitalName, visitType);
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
