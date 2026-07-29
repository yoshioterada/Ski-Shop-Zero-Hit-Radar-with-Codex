package com.skishop.controller;

import com.skishop.dto.AdminUserDto;
import com.skishop.dto.AuthMeResponse;
import com.skishop.dto.LoginRequest;
import com.skishop.dto.LoginResponse;
import com.skishop.service.AdminAuthUseCase;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin authentication API.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AdminAuthUseCase adminAuthUseCase;

	public AuthController(AdminAuthUseCase adminAuthUseCase) {
		this.adminAuthUseCase = adminAuthUseCase;
	}

	/**
	 * Authenticates the configured admin account and returns a bearer token.
	 */
	@PostMapping("/login")
	public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
		return adminAuthUseCase.login(request.username(), request.password(), sourceIp(servletRequest));
	}

	/**
	 * Returns the current admin identity for a valid bearer token.
	 */
	@GetMapping("/me")
	public AuthMeResponse me(Authentication authentication) {
		AdminUserDto user = (AdminUserDto) authentication.getPrincipal();
		return new AuthMeResponse(true, user);
	}

	/**
	 * Revokes the current bearer token.
	 */
	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout(Authentication authentication) {
		adminAuthUseCase.revokeToken(authentication == null ? null : (String) authentication.getCredentials());
	}

	private String sourceIp(HttpServletRequest request) {
		String forwardedFor = request.getHeader("X-Forwarded-For");
		if (forwardedFor != null && !forwardedFor.isBlank()) {
			return forwardedFor.split(",")[0].trim();
		}
		String realIp = request.getHeader("X-Real-IP");
		if (realIp != null && !realIp.isBlank()) {
			return realIp.trim();
		}
		return request.getRemoteAddr();
	}
}
