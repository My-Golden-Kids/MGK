package com.mgk.bemgk.service;

import com.mgk.bemgk.dto.pet.PetResponse;
import com.mgk.bemgk.repository.PetRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetService {

    private final PetRepository petRepository;

    public List<PetResponse> getPets() {
        return petRepository.findAll().stream()
                .map(PetResponse::from)
                .toList();
    }
}
