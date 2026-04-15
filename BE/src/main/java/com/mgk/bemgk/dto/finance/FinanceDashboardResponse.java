package com.mgk.bemgk.dto.finance;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FinanceDashboardResponse {

	private String bankName;
	private String accountNumber;
	private BigDecimal balance;
}
