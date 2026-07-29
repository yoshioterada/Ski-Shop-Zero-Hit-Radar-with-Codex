package com.skishop.dto;

/**
 * Authenticated administrator identity exposed to the frontend.
 *
 * @param username admin username
 * @param role admin role name
 */
public record AdminUserDto(String username, String role) {
}
