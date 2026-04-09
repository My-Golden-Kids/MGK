package com.mgk.bemgk.service;

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
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .orElseThrow(() -> new IllegalArgumentException("반려동물을 찾을 수 없습니다."));

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
                .collect(Collectors.groupingBy(
                        d -> d.getDetails() != null ? d.getDetails() : "기타",
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<VaccinationItemResponse> vaccinationItems = grouped.entrySet().stream()
                .map(entry -> {
                    String details = entry.getKey();
                    List<MedicalDocument> docs = entry.getValue();

                    // details 이름과 contains 관계인 미래 일정만 매칭
                    List<CalendarEvent> matched = futureVaccinationEvents.stream()
                            .filter(e -> matchesVaccineName(e.getName(), details))
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

    private boolean matchesVaccineName(String eventName, String details) {
        String normalizedEvent = eventName.toLowerCase().trim();
        String normalizedDetails = details.toLowerCase().trim();
        return normalizedEvent.contains(normalizedDetails)
                || normalizedDetails.contains(normalizedEvent);
    }
}
