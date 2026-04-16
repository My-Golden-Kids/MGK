package com.mgk.bemgk.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mgk.bemgk.dto.product.ProductPersonalizedReportResponse;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;
import com.mgk.bemgk.entity.SourceType;
import com.mgk.bemgk.service.CurrentUserService;
import com.mgk.bemgk.service.ProductService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

	private MockMvc mockMvc;

	@InjectMocks
	private ProductController productController;

	@Mock
	private ProductService productService;

	@Mock
	private CurrentUserService currentUserService;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(productController).build();
	}

	@Test
	@DisplayName("GET /api/products returns normalized product list")
	void getProducts_returnsProductList() throws Exception {
		Product product = Product.builder()
			.name("하나 펫보험")
			.productType(ProductType.INSURANCE)
			.description("보험")
			.sourceType(SourceType.ACCOUNT_BOOK)
			.isActive(false)
			.build();
		ReflectionTestUtils.setField(product, "id", 1L);
		when(productService.getProducts()).thenReturn(List.of(product));

		mockMvc.perform(get("/api/products"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].id").value(1))
			.andExpect(jsonPath("$[0].productType").value("INSURANCE"));
	}

	@Test
	@DisplayName("GET /api/products/personalized/featured returns featured personalized product")
	void getFeaturedPersonalizedProduct_returnsFeaturedProduct() throws Exception {
		when(currentUserService.getCurrentUserIdOrDefault()).thenReturn(1L);
		when(productService.getFeaturedPersonalizedProduct(1L, null))
			.thenReturn(ProductPersonalizedReportResponse.builder()
				.productId(3L)
				.productName("하나 펫카드")
				.productType(ProductType.CARD)
				.estimatedMonthlyBenefit(BigDecimal.valueOf(20_000))
				.build());

		mockMvc.perform(get("/api/products/personalized/featured"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.productId").value(3))
			.andExpect(jsonPath("$.productName").value("하나 펫카드"))
			.andExpect(jsonPath("$.estimatedMonthlyBenefit").value(20000));
	}

	@Test
	@DisplayName("GET /api/products/personalized/featured forwards selected pet id")
	void getFeaturedPersonalizedProduct_withPetId_forwardsPetId() throws Exception {
		when(currentUserService.getCurrentUserIdOrDefault()).thenReturn(1L);
		when(productService.getFeaturedPersonalizedProduct(1L, 7L))
			.thenReturn(ProductPersonalizedReportResponse.builder()
				.productId(5L)
				.productName("하나 펫적금")
				.productType(ProductType.SAVINGS)
				.build());

		mockMvc.perform(get("/api/products/personalized/featured").param("petId", "7"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.productId").value(5))
			.andExpect(jsonPath("$.productType").value("SAVINGS"));
	}
}
