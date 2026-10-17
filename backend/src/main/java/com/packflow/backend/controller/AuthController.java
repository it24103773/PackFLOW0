package com.packflow.backend.controller;

import com.packflow.backend.model.User;
import com.packflow.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            String fullName = request.get("fullName");
            String email = request.get("email");
            String mobileNumber = request.get("mobileNumber");
            String password = request.get("password");
            String confirmPassword = request.get("confirmPassword");

            Map<String, Object> result = authService.register(fullName, email, mobileNumber, password, confirmPassword);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            Map<String, Object> result = authService.login(email, password);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null || "REJECTED".equalsIgnoreCase(user.getStatus())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Unauthorized. Please log in.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole() != null ? user.getRole() : "Customer");
        profile.put("user_role", user.getRole() != null ? user.getRole() : "Customer");
        profile.put("mobileNumber", user.getMobileNumber() != null ? user.getMobileNumber() : "");
        profile.put("address", user.getAddress() != null ? user.getAddress() : "");
        profile.put("status", user.getStatus() != null ? user.getStatus() : "REGISTERED");
        profile.put("registrationDate", user.getRegistrationDate() != null ? user.getRegistrationDate() : "");
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        authService.logout(token);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully.");
        return ResponseEntity.ok(response);
    }

    // --- Supplier OTP Verification & Registration Endpoints ---

    @PostMapping("/supplier/request-otp")
    public ResponseEntity<?> requestSupplierOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            Map<String, Object> result = authService.requestSupplierOtp(email);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to send OTP code: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/supplier/verify-otp")
    public ResponseEntity<?> verifySupplierOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            Map<String, Object> result = authService.verifySupplierOtp(email, otp);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to verify OTP code: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/supplier/complete-registration")
    public ResponseEntity<?> completeSupplierRegistration(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            String password = request.get("password");
            String confirmPassword = request.get("confirmPassword");
            String fullName = request.get("fullName");
            String mobileNumber = request.get("mobileNumber");

            Map<String, Object> result = authService.completeSupplierRegistration(
                email, otp, password, confirmPassword, fullName, mobileNumber
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Supplier registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
