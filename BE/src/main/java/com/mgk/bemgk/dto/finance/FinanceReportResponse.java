package com.mgk.bemgk.dto.finance;

import java.math.BigDecimal;

import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FinanceReportResponse {

	private BigDecimal retirementPercent;

	private BigDecimal totalPetCost;

	private BigDecimal averageExpense;

	private BigDecimal totalAsset;

	private FinanceExpenseCategoryResponse dominantCategory;

	private FinanceExpenseCategoryResponse expenseCategory;

	private ProductPersonalizedReportResponse recommendedProduct;
}
