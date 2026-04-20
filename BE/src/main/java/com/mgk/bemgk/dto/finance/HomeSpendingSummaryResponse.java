package com.mgk.bemgk.dto.finance;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HomeSpendingSummaryResponse {

	private BigDecimal monthlyAmount;
	private String primaryCategory;
	private String summary;
	private String savingsHint;
}
