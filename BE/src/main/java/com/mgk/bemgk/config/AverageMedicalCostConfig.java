package com.mgk.bemgk.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import com.mgk.bemgk.entity.AverageMedicalCost;
import com.mgk.bemgk.repository.AverageMedicalCostRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class AverageMedicalCostConfig {

	private final AverageMedicalCostRepository repository;

	@PostConstruct
	@Transactional
	public void init() {
		saveIfMissing("진찰", "초진 진찰료", "ALL", "ALL", 10520);
		saveIfMissing("진찰", "초진 진찰료", "ALL", "SMALL", 9873);
		saveIfMissing("진찰", "초진 진찰료", "ALL", "MEDIUM", 10332);
		saveIfMissing("진찰", "초진 진찰료", "ALL", "LARGE", 11227);

		saveIfMissing("진찰", "재진 진찰료", "ALL", "ALL", 8457);
		saveIfMissing("진찰", "재진 진찰료", "ALL", "SMALL", 7931);
		saveIfMissing("진찰", "재진 진찰료", "ALL", "MEDIUM", 8318);
		saveIfMissing("진찰", "재진 진찰료", "ALL", "LARGE", 9010);

		saveIfMissing("상담", "상담료", "ALL", "ALL", 10283);

		saveIfMissing("입원", "입원비", "DOG", "ALL", 65040);
		saveIfMissing("입원", "입원비", "DOG", "SMALL", 51468);
		saveIfMissing("입원", "입원비", "DOG", "MEDIUM", 64374);
		saveIfMissing("입원", "입원비", "DOG", "LARGE", 84589);
		saveIfMissing("입원", "입원비", "CAT", "ALL", 56417);

		saveIfMissing("백신접종", "종합백신", "DOG", "ALL", 26337);
		saveIfMissing("백신접종", "종합백신", "CAT", "ALL", 39478);
		saveIfMissing("백신접종", "광견병백신", "ALL", "ALL", 24803);
		saveIfMissing("백신접종", "켄넬코프백신", "ALL", "ALL", 22666);
		saveIfMissing("백신접종", "코로나바이러스백신", "DOG", "ALL", 22266);
		saveIfMissing("백신접종", "인플루엔자백신", "ALL", "ALL", 34931);

		saveIfMissing("혈액검사", "전혈구 검사비", "ALL", "ALL", 35973);
		saveIfMissing("혈액검사", "혈액화학 검사비", "ALL", "ALL", 86502);
		saveIfMissing("혈액검사", "전해질 검사비", "ALL", "ALL", 33506);

		saveIfMissing("영상검사", "방사선촬영비", "ALL", "ALL", 46917);
		saveIfMissing("영상검사", "방사선촬영비", "ALL", "SMALL", 41026);
		saveIfMissing("영상검사", "방사선촬영비", "ALL", "MEDIUM", 46234);
		saveIfMissing("영상검사", "방사선촬영비", "ALL", "LARGE", 55451);

		saveIfMissing("영상검사", "초음파촬영비", "ALL", "ALL", 65610);
		saveIfMissing("영상검사", "초음파촬영비", "ALL", "SMALL", 58822);
		saveIfMissing("영상검사", "초음파촬영비", "ALL", "MEDIUM", 64817);
		saveIfMissing("영상검사", "초음파촬영비", "ALL", "LARGE", 77903);

		saveIfMissing("영상검사", "CT촬영비", "ALL", "ALL", 601333);
		saveIfMissing("영상검사", "CT촬영비", "ALL", "SMALL", 539411);
		saveIfMissing("영상검사", "CT촬영비", "ALL", "MEDIUM", 590026);
		saveIfMissing("영상검사", "CT촬영비", "ALL", "LARGE", 686204);

		saveIfMissing("영상검사", "MRI촬영비", "ALL", "ALL", 722789);
		saveIfMissing("영상검사", "MRI촬영비", "ALL", "SMALL", 738463);
		saveIfMissing("영상검사", "MRI촬영비", "ALL", "MEDIUM", 792058);
		saveIfMissing("영상검사", "MRI촬영비", "ALL", "LARGE", 902481);

		saveIfMissing("투약·조제", "심장사상충 예방비", "ALL", "ALL", 16542);
		saveIfMissing("투약·조제", "외부기생충 예방비", "ALL", "ALL", 18927);
		saveIfMissing("투약·조제", "광범위구충 예방비", "ALL", "ALL", 3960);
	}

	private void saveIfMissing(String category, String item, String species, String size, int avgCost) {
		if (repository.existsByCategoryAndItemAndSpeciesAndSize(category, item, species, size)) {
			return;
		}

		repository.save(AverageMedicalCost.builder()
			.category(category)
			.item(item)
			.species(species)
			.size(size)
			.avgCost(avgCost)
			.build());
	}
}
