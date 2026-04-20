package com.mgk.bemgk.dto.finance;

// 지출 추가 요청이 성공했을 때 저장된 가계부 항목 반환 응답

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AccountBookCategory;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountBookResponse {

	private Long id;
	private String title;
	private BigDecimal amount;
	private AccountBookCategory category;
	private String memo;
	private LocalDateTime spendDate;

	public static AccountBookResponse from(AccountBook accountBook) {
		return AccountBookResponse.builder()
			.id(accountBook.getId())
			.title(accountBook.getTitle())
			.amount(accountBook.getAmount())
			.category(accountBook.getCategory())
			.memo(accountBook.getMemo())
			.spendDate(accountBook.getSpendDate())
			.build();
	}
}
