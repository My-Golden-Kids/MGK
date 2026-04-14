package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.medical.CreateMedicalRecordRequest;
import com.mgk.bemgk.dto.medical.MedicalDocumentCountResponse;
import com.mgk.bemgk.dto.medical.MedicalRecordResponse;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.MedicalDocumentType;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.repository.MedicalDocumentRepository;
import com.mgk.bemgk.repository.PetRepository;
import java.util.List;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalService {

    private final MedicalDocumentRepository medicalDocumentRepository;
    private final PetRepository petRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public MedicalRecordResponse createMedicalRecord(CreateMedicalRecordRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        List<Pet> pets = petRepository.findByUser_Id(userId).stream()
                .filter(pet -> !pet.isDead())
                .toList();
        Pet pet = resolvePetByName(pets, request.petName());

        MedicalDocument medicalDocument = new MedicalDocument();
        medicalDocument.setPet(pet);
        medicalDocument.setPetName(request.petName());
        medicalDocument.setDate(LocalDate.parse(request.date()));
        medicalDocument.setType(request.type());
        medicalDocument.setHospitalName(request.hospitalName());
        medicalDocument.setDetails(request.details());
        medicalDocument.setTotalAmount(request.totalAmount());
        medicalDocument.setImageUrl(request.imageUrl());

        return MedicalRecordResponse.from(medicalDocumentRepository.save(medicalDocument));
    }

    public List<MedicalRecordResponse> getMedicalRecords(MedicalDocumentType type) {
        Long userId = currentUserService.getCurrentUserId();
        List<MedicalDocument> documents = type == null
                ? medicalDocumentRepository.findByPet_User_IdOrderByDateDescCreatedAtDesc(userId)
                : medicalDocumentRepository.findByPet_User_IdAndTypeOrderByDateDescCreatedAtDesc(userId, type);

        return documents.stream()
                .map(MedicalRecordResponse::from)
                .toList();
    }

    /** petName 퍼지 매칭: 정확일치 → 부분포함 → Levenshtein ≤ 2 → 첫 번째 펫 순으로 폴백 */
    private Pet resolvePetByName(List<Pet> pets, String petName) {
        if (pets.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "진료 기록을 등록할 수 있는 반려동물이 없습니다.");
        }
        if (petName == null || petName.isBlank()) {
            return pets.get(0);
        }
        String target = petName.trim();

        // 1. 정확 일치 (대소문자 무시)
        for (Pet p : pets) {
            if (p.getName().equalsIgnoreCase(target)) return p;
        }

        // 2. 부분 포함 (어느 한쪽이 다른 쪽을 포함)
        for (Pet p : pets) {
            String name = p.getName();
            if (name.contains(target) || target.contains(name)) return p;
        }

        // 3. Levenshtein 거리 ≤ 2 인 가장 가까운 펫
        Pet best = null;
        int bestDist = Integer.MAX_VALUE;
        for (Pet p : pets) {
            int dist = levenshtein(p.getName(), target);
            if (dist < bestDist) {
                bestDist = dist;
                best = p;
            }
        }
        if (bestDist <= 2) return best;

        // 4. 폴백: 첫 번째 펫
        return pets.get(0);
    }

    private int levenshtein(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                        ? dp[i - 1][j - 1]
                        : 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
            }
        }
        return dp[m][n];
    }

    // 접종 횟수 count -> DTO 변환 로직
    public List<MedicalDocumentCountResponse> getMedicalDocumentCounts(Long petId, MedicalDocumentType type) {
        return medicalDocumentRepository.findDocumentCountsByPetIdAndType(petId, type)
                .stream()
                .map(result -> MedicalDocumentCountResponse.builder()
                        .petId(result.getPetId())
                        .type(result.getType())
                        .details(result.getDetails())
                        .count(result.getDocumentCount())
                        .build())
                .toList();
    }
}
