package com.mgk.bemgk.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.entity.AverageMedicalCost;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetSize;
import com.mgk.bemgk.repository.AverageMedicalCostRepository;
import com.mgk.bemgk.repository.PetRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AverageMedicalCostService {

	private static final String ALL = "ALL";
	private static final Map<String, List<String>> ITEM_ALIASES = Map.of(
		"초진 진찰료", List.of("초진진찰료", "초진", "초진료", "첫진료", "첫진찰"),
		"입원비", List.of("입원비", "입원료", "입원")
	);

	private final AverageMedicalCostRepository repository;
	private final PetRepository petRepository;
	private final CurrentUserService currentUserService;

	public boolean isAverageCostQuery(String transcript) {
		return hasAverageCostQuestionKeyword(transcript)
			&& resolveItemName(transcript).isPresent();
	}

	public String answer(Long petId, String transcript) {
		String item = resolveItemName(transcript)
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"해당 진료 항목의 평균 비용 데이터를 찾을 수 없습니다."
			));

		return formatAnswer(find(petId, item));
	}

	public String answerByItem(Long petId, String item) {
		String resolvedItem = resolveItemName(item).orElseGet(() -> item.trim());
		return formatAnswer(find(petId, resolvedItem));
	}

	public AverageMedicalCost find(Long petId, String item) {
		Pet pet = resolveOwnedAlivePet(petId);
		String species = mapSpecies(pet.getSpecies());
		String size = mapSize(pet.getSize());

		List<AverageMedicalCost> candidates = repository.findByItem(item);

		if (candidates.isEmpty()) {
			throw new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"해당 진료 항목의 평균 비용 데이터를 찾을 수 없습니다."
			);
		}

		return pickBest(candidates, species, size);
	}

	private Pet resolveOwnedAlivePet(Long petId) {
		Long userId = currentUserService.getCurrentUserId();
		Pet pet = petId == null
			? petRepository.findByUser_Id(userId).stream()
			.filter(candidate -> !candidate.isDead())
			.findFirst()
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"평균 진료비를 조회할 반려동물이 없습니다."
			))
			: petRepository.findByIdAndUser_Id(petId, userId)
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"반려동물을 찾을 수 없습니다."
			));

		if (pet.isDead()) {
			throw new ResponseStatusException(
				HttpStatus.CONFLICT,
				"사망한 반려동물은 평균 진료비 조회 대상에서 제외됩니다."
			);
		}

		return pet;
	}

	private AverageMedicalCost pickBest(List<AverageMedicalCost> list, String species, String size) {
		return find(list, species, size)
			.or(() -> find(list, species, ALL))
			.or(() -> find(list, ALL, size))
			.or(() -> find(list, ALL, ALL))
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"반려동물 조건에 맞는 평균 비용 데이터를 찾을 수 없습니다."
			));
	}

	private Optional<AverageMedicalCost> find(List<AverageMedicalCost> list, String species, String size) {
		return list.stream()
			.filter(value -> species.equals(value.getSpecies()) && size.equals(value.getSize()))
			.findFirst();
	}

	private Optional<String> resolveItemName(String transcript) {
		String normalizedTranscript = normalize(transcript);

		if (normalizedTranscript.isBlank()) {
			return Optional.empty();
		}

		for (Map.Entry<String, List<String>> entry : ITEM_ALIASES.entrySet()) {
			if (normalizedTranscript.contains(normalize(entry.getKey()))) {
				return Optional.of(entry.getKey());
			}

			boolean hasAlias = entry.getValue().stream()
				.map(this::normalize)
				.anyMatch(normalizedTranscript::contains);

			if (hasAlias) {
				return Optional.of(entry.getKey());
			}
		}

		return repository.findAll().stream()
			.map(AverageMedicalCost::getItem)
			.distinct()
			.filter(item -> normalizedTranscript.contains(normalize(item)))
			.findFirst();
	}

	private boolean hasAverageCostQuestionKeyword(String transcript) {
		String normalizedTranscript = normalize(transcript);

		return normalizedTranscript.contains("알려")
			|| normalizedTranscript.contains("얼마")
			|| normalizedTranscript.contains("평균")
			|| normalizedTranscript.contains("비용")
			|| normalizedTranscript.contains("진찰료")
			|| normalizedTranscript.contains("입원비");
	}

	private String normalize(String text) {
		if (text == null) {
			return "";
		}

		return text.replaceAll("[\\s?？!！.。,，]", "");
	}

	private String mapSpecies(String species) {
		if (species == null) {
			return ALL;
		}

		if (species.contains("고양")) {
			return "CAT";
		}

		if (species.contains("강아") || species.contains("개")) {
			return "DOG";
		}

		return ALL;
	}

	private String mapSize(PetSize size) {
		if (size == null) {
			return ALL;
		}

		return switch (size) {
			case 소형 -> "SMALL";
			case 중형 -> "MEDIUM";
			case 대형 -> "LARGE";
		};
	}

	private String formatAnswer(AverageMedicalCost averageMedicalCost) {
		return "%s 평균은 %,d원이에요."
			.formatted(averageMedicalCost.getItem(), averageMedicalCost.getAvgCost());
	}
}
