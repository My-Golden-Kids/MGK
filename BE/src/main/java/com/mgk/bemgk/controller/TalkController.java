package com.mgk.bemgk.controller;

import com.mgk.bemgk.dto.talk.TalkRequest;
import com.mgk.bemgk.dto.talk.TalkResponse;
import com.mgk.bemgk.service.TalkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/talk")
public class TalkController {

    private final TalkService talkService;

    @PostMapping
    public TalkResponse talk(@Valid @RequestBody TalkRequest request) {
        return talkService.ask(request.transcript());
    }
}
