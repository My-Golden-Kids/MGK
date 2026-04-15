package com.mgk.bemgk.dto.finance;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FinanceExpenseCategoryResponse {

    private String category;
    private String categoryLabel;
    private BigDecimal amount;
    private BigDecimal percent;
}
