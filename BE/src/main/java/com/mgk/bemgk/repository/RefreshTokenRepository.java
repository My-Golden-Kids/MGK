package com.mgk.bemgk.repository;

import com.mgk.bemgk.entity.RefreshToken;
import com.mgk.bemgk.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByToken(String token);

    void deleteAllByUser(User user);
}
