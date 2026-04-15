package com.mgk.bemgk.service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.mgk.bemgk.dto.vaccination.CreateScheduleRequest;
import com.mgk.bemgk.dto.vaccination.ScheduleCalendarEntry;
import com.mgk.bemgk.dto.vaccination.VaccinationHistoryItem;
import com.mgk.bemgk.dto.vaccination.VaccinationItemResponse;
import com.mgk.bemgk.dto.vaccination.VaccinationPetSummaryResponse;
import com.mgk.bemgk.entity.CalendarEvent;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.CalendarRepository;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VaccinationService {

	private final CalendarRepository calendarRepository;
	private final PetRepository petRepository;
	private final MedicalDocumentRepository medicalDocumentRepository;

	public List<ScheduleCalendarEntry> getSchedules(Long userId, int year, int month) {
		LocalDate start = LocalDate.of(year, month, 1);
		LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

		List<CalendarEvent> events = calendarRepository
			.findByPet_User_IdAndDateBetweenOrderByDate(userId, start, end);

		Map<String, List<String>> grouped = events.stream()
			.filter(e -> !e.getPet().isDead())
			.collect(Collectors.groupingBy(
				e -> e.getDate().toString(),
				LinkedHashMap::new,
				Collectors.mapping(CalendarEvent::getEventType, Collectors.toList())
			));

		return grouped.entrySet().stream()
			.map(entry -> ScheduleCalendarEntry.builder()
				.date(entry.getKey())
				.eventTypes(entry.getValue().stream().distinct().toList())
				.build())
			.toList();
	}

	@Transactional
	public CalendarEvent createSchedule(Long userId, CreateScheduleRequest request) {
		Pet pet = petRepository.findById(request.getPetId())
			.filter(p -> p.getUser().getId().equals(userId))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "반려동물을 찾을 수 없습니다."));

		if (pet.isDead()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "사망한 반려동물에는 일정을 추가할 수 없습니다.");
		}

		CalendarEvent event = CalendarEvent.builder()
			.pet(pet)
			.name(request.getName())
			.date(request.getDate())
			.memo(request.getMemo())
			.eventType(request.getEventType())
			.build();

		return calendarRepository.save(event);
	}

	public List<VaccinationPetSummaryResponse> getSummary(Long userId) {
		List<Pet> pets = petRepository.findByUser_Id(userId);
		LocalDate today = LocalDate.now();

		return pets.stream()
			.filter(pet -> !pet.isDead())
			.map(pet -> buildPetSummary(pet, today))
			.toList();
	}

	private VaccinationPetSummaryResponse buildPetSummary(Pet pet, LocalDate today) {
		String latestScheduleLabel = calendarRepository
			.findFirstByPet_IdAndDateGreaterThanEqualOrderByDateAsc(pet.getId(), today)
			.map(e -> e.getName() + "("
				+ e.getDate().getMonthValue() + "월 "
				+ e.getDate().getDayOfMonth() + "일)")
			.orElse("예정된 일정 없음");

		// 미래 VACCINATION 일정 전체 (인메모리 매칭용)
		List<CalendarEvent> futureVaccinationEvents = calendarRepository
			.findByPet_IdAndEventTypeAndDateGreaterThanEqualOrderByDateAsc(
				pet.getId(), "VACCINATION", today);

		List<MedicalDocument> vaccinationDocs = medicalDocumentRepository
			.findByPet_IdAndTypeOrderByDateDescCreatedAtDesc(pet.getId(), MedicalDocumentType.VACCINATION);

		Map<String, List<MedicalDocument>> grouped = vaccinationDocs.stream()
			.flatMap(d -> {
				String details = d.getDetails();
				if (details == null || details.isBlank()) {
					return Stream.of(Map.entry("기타", d));
				}
				List<Map.Entry<String, MedicalDocument>> vaccinationParts = Arrays.stream(details.split("/"))
					.map(String::trim)
					.filter(part -> !part.isBlank() && part.contains("접종"))
					.map(part -> Map.entry(part, d))
					.toList();
				return vaccinationParts.isEmpty()
					? Stream.of(Map.entry("기타", d))
					: vaccinationParts.stream();
			})
			.collect(Collectors.groupingBy(
				Map.Entry::getKey,
				LinkedHashMap::new,
				Collectors.mapping(Map.Entry::getValue, Collectors.toList())
			));

		List<VaccinationItemResponse> vaccinationItems = grouped.entrySet().stream()
			.map(entry -> {
				String details = entry.getKey();
				List<MedicalDocument> docs = entry.getValue();

				// details 이름과 contains 관계인 미래 일정만 매칭
				List<CalendarEvent> matched = futureVaccinationEvents.stream()
					.filter(e -> matchesVaccineName(e.getName(), e.getMemo(), details))
					.toList();

				List<VaccinationHistoryItem> pastHistory = docs.stream()
					.filter(d -> d.getDate() != null)
					.sorted(Comparator.comparing(MedicalDocument::getDate))
					.map(d -> VaccinationHistoryItem.builder()
						.date(d.getDate().toString())
						.completed(true)
						.build())
					.toList();

				List<VaccinationHistoryItem> futureHistory = matched.stream()
					.map(e -> VaccinationHistoryItem.builder()
						.date(e.getDate().toString())
						.memo(e.getMemo())
						.completed(false)
						.build())
					.toList();

				List<VaccinationHistoryItem> history = new java.util.ArrayList<>();
				history.addAll(pastHistory);
				history.addAll(futureHistory);

				String lastDate = docs.stream()
					.filter(d -> d.getDate() != null)
					.map(d -> d.getDate().toString())
					.findFirst()
					.orElse("-");

				String nextDate = matched.isEmpty() ? "-" : matched.get(0).getDate().toString();

				return VaccinationItemResponse.builder()
					.id(details)
					.title(details)
					.totalCount(docs.size())
					.lastDate(lastDate)
					.nextDate(nextDate)
					.history(history)
					.build();
			})
			.toList();

		return VaccinationPetSummaryResponse.builder()
			.petId(pet.getId())
			.petName(pet.getName())
			.petImageUrl(pet.getImage())
			.latestScheduleLabel(latestScheduleLabel)
			.vaccinationItems(vaccinationItems)
			.build();
	}

	private boolean matchesVaccineName(String eventName, String eventMemo, String docKey) {
		String normalizedDoc = normalizeEventName(docKey).toLowerCase();
		return containsMatch(normalizedDoc, normalizeEventName(eventName).toLowerCase())
			|| containsMatch(normalizedDoc, normalizeEventName(eventMemo).toLowerCase());
	}

	private boolean containsMatch(String str1, String str2) {
		if (str1.isEmpty() || str2.isEmpty()) {
			return false;
		}
		return str1.contains(str2) || str2.contains(str1);
	}

	/** 이벤트 이름 정규화: '접종' 키워드 제거 후 trim */
	private String normalizeEventName(String name) {
		if (name == null) {
			return "";
		}
		return name.replaceAll("예방접종|접종", "")
			.replaceAll("\\d+차", "")
			.replaceAll("\\(.*?\\)", "")
			.replaceAll("\\s+", "")
			.trim();
	}
}
