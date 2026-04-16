package com.mgk.bemgk.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.mgk.bemgk.entity.Account;
import com.mgk.bemgk.entity.AccountBook;
import com.mgk.bemgk.entity.AverageMedicalCost;
import com.mgk.bemgk.entity.CalendarEvent;
import com.mgk.bemgk.entity.FeedingSchedule;
import com.mgk.bemgk.entity.MapLocation;
import com.mgk.bemgk.entity.MedicalDocument;
import com.mgk.bemgk.entity.Pet;
import com.mgk.bemgk.entity.PetWalkRecord;
import com.mgk.bemgk.entity.Product;
import com.mgk.bemgk.entity.RefreshToken;
import com.mgk.bemgk.entity.Transaction;
import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.entity.Verification;
import java.lang.reflect.Method;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.JpaRepository;

class RepositoryContractTest {

	@Test
	void repositories_extendJpaRepositoryForExpectedEntities() {
		assertThat(JpaRepository.class).isAssignableFrom(AccountBookRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(AccountRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(AverageMedicalCostRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(CalendarRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(FeedingScheduleRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(MapRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(MedicalDocumentRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(PetRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(PetWalkRecordRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(ProductRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(RefreshTokenRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(TransactionRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(UserRepository.class);
		assertThat(JpaRepository.class).isAssignableFrom(VerificationRepository.class);
	}

	@Test
	void repositories_exposeKeyCustomQueryMethods() throws Exception {
		assertThat(AccountBookRepository.class.getMethod("sumPetExpenseByUserId", Long.class).getReturnType())
			.isEqualTo(java.math.BigDecimal.class);
		assertThat(AccountRepository.class.getMethod("findFirstByUser_IdOrderByIdAsc", Long.class).getReturnType())
			.isEqualTo(Optional.class);
		assertThat(AverageMedicalCostRepository.class.getMethod("findByItem", String.class).getReturnType())
			.isEqualTo(java.util.List.class);
		assertThat(CalendarRepository.class.getMethod(
			"findFirstByPet_IdAndEventTypeAndDateGreaterThanEqualOrderByDateAsc",
			Long.class, String.class, java.time.LocalDate.class).getReturnType()).isEqualTo(Optional.class);
		assertThat(FeedingScheduleRepository.class.getMethod("findByPetId", Long.class).getReturnType())
			.isEqualTo(Optional.class);
		assertThat(MedicalDocumentRepository.class.getMethod(
			"findByPet_IdAndTypeOrderByDateDescCreatedAtDesc",
			Long.class, com.mgk.bemgk.entity.MedicalDocumentType.class).getReturnType()).isEqualTo(java.util.List.class);
		assertThat(PetRepository.class.getMethod("findByIdAndUser_Id", Long.class, Long.class).getReturnType())
			.isEqualTo(Optional.class);
		assertThat(PetWalkRecordRepository.class.getMethod("findByPet_IdAndSource", Long.class, String.class).getReturnType())
			.isEqualTo(Optional.class);
		assertThat(ProductRepository.class.getMethod(
			"findFirstByProductTypeAndIsActiveTrue",
			com.mgk.bemgk.entity.ProductType.class).getReturnType()).isEqualTo(Optional.class);
		assertThat(RefreshTokenRepository.class.getMethod("findByToken", String.class).getReturnType())
			.isEqualTo(Optional.class);
		assertThat(UserRepository.class.getMethod("findByEmail", String.class).getReturnType()).isEqualTo(Optional.class);
		assertThat(VerificationRepository.class.getMethod("findByToken", String.class).getReturnType())
			.isEqualTo(Optional.class);
	}

	@Test
	void repositoryGenericTypes_matchExpectedEntityClasses() {
		assertThat(repositoryDomainType(AccountBookRepository.class)).isEqualTo(AccountBook.class);
		assertThat(repositoryDomainType(AccountRepository.class)).isEqualTo(Account.class);
		assertThat(repositoryDomainType(AverageMedicalCostRepository.class)).isEqualTo(AverageMedicalCost.class);
		assertThat(repositoryDomainType(CalendarRepository.class)).isEqualTo(CalendarEvent.class);
		assertThat(repositoryDomainType(FeedingScheduleRepository.class)).isEqualTo(FeedingSchedule.class);
		assertThat(repositoryDomainType(MapRepository.class)).isEqualTo(MapLocation.class);
		assertThat(repositoryDomainType(MedicalDocumentRepository.class)).isEqualTo(MedicalDocument.class);
		assertThat(repositoryDomainType(PetRepository.class)).isEqualTo(Pet.class);
		assertThat(repositoryDomainType(PetWalkRecordRepository.class)).isEqualTo(PetWalkRecord.class);
		assertThat(repositoryDomainType(ProductRepository.class)).isEqualTo(Product.class);
		assertThat(repositoryDomainType(RefreshTokenRepository.class)).isEqualTo(RefreshToken.class);
		assertThat(repositoryDomainType(TransactionRepository.class)).isEqualTo(Transaction.class);
		assertThat(repositoryDomainType(UserRepository.class)).isEqualTo(User.class);
		assertThat(repositoryDomainType(VerificationRepository.class)).isEqualTo(Verification.class);
	}

	private Class<?> repositoryDomainType(Class<?> repositoryClass) {
		for (java.lang.reflect.Type type : repositoryClass.getGenericInterfaces()) {
			if (type instanceof java.lang.reflect.ParameterizedType parameterizedType
				&& parameterizedType.getRawType().getTypeName().contains("JpaRepository")) {
				return (Class<?>) parameterizedType.getActualTypeArguments()[0];
			}
		}
		throw new AssertionError("JpaRepository generic type not found for " + repositoryClass.getSimpleName());
	}
}
