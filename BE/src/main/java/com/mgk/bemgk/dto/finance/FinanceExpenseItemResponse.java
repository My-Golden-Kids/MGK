package com.mgk.bemgk.dto.finance;

// 월별 지출 내역 조회에서 각 지출 항목 단일건 응답

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FinanceExpenseItemResponse {

	private Long id;
	private String title;
	private AccountBookCategory category;
	private BigDecimal amount;
	private String memo;
	private LocalDateTime spendDate;

	public static FinanceExpenseItemResponse from(AccountBook accountBook) {
		return FinanceExpenseItemResponse.builder()
			.id(accountBook.getId())
			.title(accountBook.getTitle())
			.category(accountBook.getCategory())
			.amount(accountBook.getAmount())
			.memo(accountBook.getMemo())
			.spendDate(accountBook.getSpendDate())
			.build();
	}
}
