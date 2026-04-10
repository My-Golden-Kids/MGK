package com.mgk.bemgk.controller;

import com.mgk.bemgk.dto.pet.CreatePetRequest;
import com.mgk.bemgk.dto.pet.PetResponse;
import com.mgk.bemgk.dto.pet.UpdatePetRequest;
import com.mgk.bemgk.dto.pet.WalkDtos.LiveWalkResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.SaveWalkRequest;
import com.mgk.bemgk.dto.pet.WalkDtos.WalkRecordResponse;
import com.mgk.bemgk.dto.pet.WalkDtos.WalkResponse;
import com.mgk.bemgk.service.PetService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @PostMapping
    public PetResponse createPet(@Valid @RequestBody CreatePetRequest request) {
        return petService.createPet(request);
    }

    @GetMapping
    public List<PetResponse> getPets() {
        return petService.getPets();
    }

    @GetMapping("/{petId}")
    public PetResponse getPet(@PathVariable Long petId) {
        return petService.getPet(petId);
    }

    @PatchMapping("/{petId}")
    public PetResponse updatePet(
            @PathVariable Long petId,
            @RequestBody UpdatePetRequest request
    ) {
        return petService.updatePet(petId, request);
    }

    @PatchMapping("/{petId}/walk")
    public WalkResponse saveWalk(
            @PathVariable Long petId,
            @Valid @RequestBody SaveWalkRequest request
    ) {
        return petService.saveWalk(petId, request);
    }

    @GetMapping("/{petId}/walk/live")
    public LiveWalkResponse getLiveWalk(@PathVariable Long petId) {
        return petService.getLiveWalk(petId);
    }

    @GetMapping("/{petId}/walk-records")
    public List<WalkRecordResponse> getWalkRecords(@PathVariable Long petId) {
        return petService.getWalkRecords(petId);
    }
}
