package com.mgk.bemgk.dto.finance;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FinanceReportResponse {

	private BigDecimal retirementPercent;

	private BigDecimal totalPetCost;

	private BigDecimal averageExpense;

	private BigDecimal totalAsset;
}