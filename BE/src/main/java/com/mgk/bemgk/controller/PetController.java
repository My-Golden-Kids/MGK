package com.mgk.bemgk.controller;

import com.mgk.bemgk.dto.pet.PetResponse;
import com.mgk.bemgk.service.PetService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @GetMapping
    public List<PetResponse> getPets() {
        return petService.getPets();
    }
}
