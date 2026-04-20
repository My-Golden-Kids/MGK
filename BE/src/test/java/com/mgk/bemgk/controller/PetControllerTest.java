package com.mgk.bemgk.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgk.bemgk.dto.pet.PetResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.LiveWalkResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.WalkRecordResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.WalkResponse;
import com.mgk.bemgk.service.PetService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class PetControllerTest {

	private MockMvc mockMvc;

	@Mock
	private PetService petService;

	@InjectMocks
	private PetController petController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(petController).build();
	}

	@Test
	void petCrudEndpoints_returnPayload() throws Exception {
		when(petService.createPet(org.mockito.ArgumentMatchers.any())).thenReturn(petResponse());
		when(petService.getPets()).thenReturn(List.of(petResponse()));
		when(petService.getPet(1L)).thenReturn(petResponse());
		when(petService.updatePet(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any())).thenReturn(petResponse());

		mockMvc.perform(post("/api/pets")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"name":"멩이","age":3,"species":"강아지","size":"소형"}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("멩이"));

		mockMvc.perform(get("/api/pets"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].name").value("멩이"));

		mockMvc.perform(get("/api/pets/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(1));

		mockMvc.perform(patch("/api/pets/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"멩이2\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("멩이"));

		mockMvc.perform(delete("/api/pets/1"))
			.andExpect(status().isNoContent());
		verify(petService).deletePet(1L);
	}

	@Test
	void walkEndpoints_returnPayload() throws Exception {
		when(petService.saveWalk(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any()))
			.thenReturn(WalkResponse.builder()
				.petId(1L)
				.savedStepCount(3000)
				.totalRewardAmount(BigDecimal.ONE)
				.build());
		when(petService.getLiveWalk(1L)).thenReturn(LiveWalkResponse.builder()
			.petId(1L)
			.source("healthkit")
			.stepCount(1000)
			.completed(false)
			.build());
		when(petService.getWalkRecords(1L)).thenReturn(List.of(WalkRecordResponse.builder()
			.id(1L)
			.petId(1L)
			.walkedAt(LocalDateTime.now())
			.stepCount(1000)
			.walkTimeSeconds(600)
			.rewardAmount(0)
			.build()));

		mockMvc.perform(patch("/api/pets/1/walk")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"stepCount":3000,"walkTimeSeconds":600,"distanceKm":1.2}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.petId").value(1));

		mockMvc.perform(get("/api/pets/1/walk/live"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.source").value("healthkit"));

		mockMvc.perform(get("/api/pets/1/walk-records"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].petId").value(1));
	}

	private PetResponse petResponse() {
		return PetResponse.builder()
			.id(1L)
			.name("멩이")
			.age(3.0)
			.species("강아지")
			.size("소형")
			.isDeath(false)
			.build();
	}
}
