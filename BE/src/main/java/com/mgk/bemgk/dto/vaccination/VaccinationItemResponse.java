package com.mgk.bemgk.dto.vaccination;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VaccinationItemResponse {

	private String id;
	private String title;
	private int totalCount;
	private String lastDate;
	private String nextDate;
	private List<VaccinationHistoryItem> history;
}
