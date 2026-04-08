package com.mgk.bemgk.dto.finance;

// 지출 추가 화면에서 입력한 값을 가계부 저장 하기 위한 요청
import com.mgk.bemgk.entity.AccountBookCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateAccountBookRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    @NotNull
    private AccountBookCategory category;

    @Size(max = 1000)
    private String memo;

    @NotNull
    private LocalDateTime spendDate;
}
