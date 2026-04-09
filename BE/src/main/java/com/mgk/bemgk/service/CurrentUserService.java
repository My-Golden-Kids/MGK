package com.mgk.bemgk.service;

import com.mgk.bemgk.entity.User;
import com.mgk.bemgk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public Long getCurrentUserIdOrDefault() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            return userId;
        }

        User defaultUser = userRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new IllegalArgumentException("기본 사용자가 존재하지 않습니다."));

        return defaultUser.getId();
    }
}
