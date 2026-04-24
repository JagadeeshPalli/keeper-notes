package com.keepernotes.service;

import com.keepernotes.dto.request.LoginRequest;
import com.keepernotes.dto.request.RefreshTokenRequest;
import com.keepernotes.dto.request.RegisterRequest;
import com.keepernotes.dto.response.AuthResponse;
import com.keepernotes.dto.response.UserResponse;
import com.keepernotes.entity.User;
import com.keepernotes.exception.AppException;
import com.keepernotes.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.conflict("EMAIL_TAKEN", "An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName().trim())
                .build();

        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> AppException.unauthorized("Invalid email or password"));

        if (user.getPasswordHash() == null) {
            throw AppException.badRequest("OAUTH_ACCOUNT",
                    "This account uses Google login. Please sign in with Google.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw AppException.unauthorized("Invalid email or password");
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        String token = request.getRefreshToken();

        if (!tokenService.isRefreshTokenValid(token)) {
            throw AppException.unauthorized("Refresh token is invalid or has expired");
        }

        UUID userId = tokenService.getUserIdFromRefreshToken(token)
                .orElseThrow(() -> AppException.unauthorized("Refresh token not found"));

        tokenService.invalidateRefreshToken(token);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("User no longer exists"));

        return buildAuthResponse(user);
    }

    public void logout(String refreshToken) {
        if (refreshToken != null) {
            tokenService.invalidateRefreshToken(refreshToken);
        }
    }

    public UserResponse me(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
        return UserResponse.from(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail());
        tokenService.storeRefreshToken(refreshToken, user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.from(user))
                .build();
    }
}
