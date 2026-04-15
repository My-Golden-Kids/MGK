package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.AverageMedicalCost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AverageMedicalCostRepository extends JpaRepository<AverageMedicalCost, Long> {

	List<AverageMedicalCost> findByItem(String item);

	boolean existsByCategoryAndItemAndSpeciesAndSize(String category, String item, String species, String size);
}
