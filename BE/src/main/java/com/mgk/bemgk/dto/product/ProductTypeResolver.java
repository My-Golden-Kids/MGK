package com.mgk.bemgk.dto.product;

import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.ProductType;

public final class ProductTypeResolver {

	private ProductTypeResolver() {
	}

	public static ProductType resolve(Product product) {
		String normalizedName = product.getName() == null ? "" : product.getName().replace(" ", "").toLowerCase();

		if (normalizedName.contains("펫포레스트")) {
			return ProductType.PET_FOREST;
		}
		if (normalizedName.contains("펫케어")) {
			return ProductType.SUBSCRIPTION;
		}
		return product.getProductType();
	}
}
