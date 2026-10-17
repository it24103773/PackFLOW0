package com.packflow.backend.service;

import com.packflow.backend.model.Customer;
import com.packflow.backend.model.Supplier;
import com.packflow.backend.model.User;
import com.packflow.backend.repository.FileCustomerRepository;
import com.packflow.backend.repository.FileSupplierRepository;
import com.packflow.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final FileCustomerRepository customerRepository;
    private final FileSupplierRepository supplierRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, User> activeSessions = new ConcurrentHashMap<>();
    private final Map<String, String> supplierOtpStore = new ConcurrentHashMap<>();

    @Autowired
    public AuthService(UserRepository userRepository, FileCustomerRepository customerRepository, FileSupplierRepository supplierRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.emailService = emailService;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Map<String, Object> register(String fullName, String email, String mobileNumber, String password, String confirmPassword) {
        if (fullName == null || fullName.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            password == null || password.trim().isEmpty() ||
            confirmPassword == null || confirmPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("All required fields must be filled.");
        }

        String cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format.");
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Email already exists.");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        // Stakeholder email to role mapping rule
        String assignedRole = "Customer";
        if (cleanEmail.equals("senuraperera@packflow.com") || cleanEmail.equals("senuraperera@packflowcom")) {
            assignedRole = "System Administrator";
        } else if (cleanEmail.equals("bihanbihan@packflow.com")) {
            assignedRole = "Inventory Manager";
        } else if (cleanEmail.equals("damsakdamsak@packflow.com")) {
            assignedRole = "Packaging Manager";
        } else if (cleanEmail.equals("yuthma@packflow.com")) {
            assignedRole = "Supplier";
        }

        String registrationDate = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String phone = (mobileNumber != null && !mobileNumber.trim().isEmpty()) ? mobileNumber.trim() : "+1 (555) " + (100 + (int)(Math.random() * 899)) + "-" + (1000 + (int)(Math.random() * 8999));
        
        // Customers require Admin registration/approval ("PENDING"), internal staff are automatically "REGISTERED"
        String status = "Customer".equalsIgnoreCase(assignedRole) ? "PENDING" : "REGISTERED";

        // Plaintext password storage (no encryption)
        User newUser = new User(null, fullName.trim(), cleanEmail, password, assignedRole, phone, status, registrationDate);
        User savedUser = userRepository.save(newUser);

        if ("Customer".equalsIgnoreCase(assignedRole)) {
            Customer newCustomer = new Customer(null, fullName.trim(), cleanEmail, phone, status, registrationDate, null, null, 1L);
            customerRepository.save(newCustomer);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Registration Successful");
        response.put("userId", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("mobileNumber", savedUser.getMobileNumber());
        response.put("status", savedUser.getStatus());
        return response;
    }

    public Map<String, Object> register(String fullName, String email, String password, String confirmPassword) {
        return register(fullName, email, null, password, confirmPassword);
    }

    public Map<String, Object> login(String email, String password) {
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Incorrect email or password."));

        if ("REJECTED".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Your customer registration/order request has been rejected by Administration. Access denied.");
        }

        boolean matches = password.equals(user.getPassword());
        if (!matches && user.getPassword() != null && user.getPassword().startsWith("$2a$")) {
            matches = passwordEncoder.matches(password, user.getPassword());
        }

        if (!matches) {
            throw new IllegalArgumentException("Incorrect email or password.");
        }

        String token = "PF-TOKEN-" + UUID.randomUUID().toString();
        activeSessions.put(token, user);

        Map<String, Object> userObj = new HashMap<>();
        userObj.put("id", user.getId());
        userObj.put("fullName", user.getFullName());
        userObj.put("email", user.getEmail());
        userObj.put("role", user.getRole() != null ? user.getRole() : "Customer");
        userObj.put("user_role", user.getRole() != null ? user.getRole() : "Customer");
        userObj.put("mobileNumber", user.getMobileNumber() != null ? user.getMobileNumber() : "");
        userObj.put("address", user.getAddress() != null ? user.getAddress() : "");
        userObj.put("status", user.getStatus() != null ? user.getStatus() : "REGISTERED");
        userObj.put("registrationDate", user.getRegistrationDate() != null ? user.getRegistrationDate() : "");

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", userObj);
        return response;
    }

    public User getUserByToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }
        String cleanToken = token.replace("Bearer ", "").trim();
        User user = activeSessions.get(cleanToken);
        if (user != null) {
            // Refresh latest user status from repository in case admin changed status
            userRepository.findByEmail(user.getEmail()).ifPresent(u -> {
                user.setStatus(u.getStatus());
                user.setMobileNumber(u.getMobileNumber());
                user.setAddress(u.getAddress());
                user.setRole(u.getRole());
                user.setFullName(u.getFullName());
            });
            if ("REJECTED".equalsIgnoreCase(user.getStatus())) {
                activeSessions.remove(cleanToken);
                return null;
            }
        }
        return user;
    }

    public void invalidateSessionsForUser(String email) {
        if (email == null) return;
        String cleanEmail = email.trim().toLowerCase();
        activeSessions.entrySet().removeIf(entry -> entry.getValue() != null && cleanEmail.equalsIgnoreCase(entry.getValue().getEmail()));
    }

    public void logout(String token) {
        if (token != null) {
            String cleanToken = token.replace("Bearer ", "").trim();
            activeSessions.remove(cleanToken);
        }
    }

    public String hashPassword(String rawPassword) {
        return rawPassword;
    }

    public Map<String, Object> requestSupplierOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Business email address is required.");
        }
        String cleanEmail = email.trim().toLowerCase();

        // Verify supplier exists and is approved by admin
        Supplier supplier = supplierRepository.findByEmail(cleanEmail).orElse(null);
        User userAcc = userRepository.findByEmail(cleanEmail).orElse(null);

        if (supplier == null && userAcc == null) {
            throw new IllegalArgumentException("No approved supplier record found for '" + cleanEmail + "'. Please submit a supplier inquiry first and await Admin verification.");
        }

        if (supplier != null && "REJECTED".equalsIgnoreCase(supplier.getStatus())) {
            throw new IllegalArgumentException("This supplier account has been rejected by Administration.");
        }
        if (userAcc != null && "REJECTED".equalsIgnoreCase(userAcc.getStatus())) {
            throw new IllegalArgumentException("This user account has been rejected by Administration.");
        }

        // Generate 6-digit random OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
        supplierOtpStore.put(cleanEmail, otp);

        // Dispatch OTP email to supplier
        if (emailService != null) {
            emailService.sendOtpEmail(cleanEmail, otp);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "OTP verification code sent directly to your email inbox (" + cleanEmail + "). Please check your email inbox for the 6-digit code.");
        result.put("email", cleanEmail);
        return result;
    }

    public Map<String, Object> verifySupplierOtp(String email, String otp) {
        if (email == null || email.trim().isEmpty() || otp == null || otp.trim().isEmpty()) {
            throw new IllegalArgumentException("Email and 6-digit OTP code are required.");
        }
        String cleanEmail = email.trim().toLowerCase();
        String storedOtp = supplierOtpStore.get(cleanEmail);

        if (storedOtp == null || !storedOtp.equalsIgnoreCase(otp.trim())) {
            throw new IllegalArgumentException("Invalid OTP verification code. Please check your email or request a new code.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("verified", true);
        result.put("message", "OTP code verified successfully! Please enter your custom password to complete registration.");
        result.put("email", cleanEmail);
        return result;
    }

    public Map<String, Object> completeSupplierRegistration(String email, String otp, String password, String confirmPassword, String fullName, String mobileNumber) {
        verifySupplierOtp(email, otp);

        if (password == null || password.trim().isEmpty() || confirmPassword == null || confirmPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Password and confirm password are required.");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        String cleanEmail = email.trim().toLowerCase();

        // Find or create User account for Supplier
        User userAcc = userRepository.findByEmail(cleanEmail).orElse(null);
        if (userAcc == null) {
            userAcc = new User();
            userAcc.setEmail(cleanEmail);
            userAcc.setRegistrationDate(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }

        userAcc.setRole("Supplier");
        userAcc.setStatus("REGISTERED");
        userAcc.setPassword(password);
        if (fullName != null && !fullName.trim().isEmpty()) {
            userAcc.setFullName(fullName.trim());
        }
        if (mobileNumber != null && !mobileNumber.trim().isEmpty()) {
            userAcc.setMobileNumber(mobileNumber.trim());
        }

        User savedUser = userRepository.save(userAcc);

        // Update supplier record in suppliers.json if present
        Supplier supplier = supplierRepository.findByEmail(cleanEmail).orElse(null);
        if (supplier != null) {
            supplier.setStatus("REGISTERED");
            if (fullName != null && !fullName.trim().isEmpty()) supplier.setContactPerson(fullName.trim());
            if (mobileNumber != null && !mobileNumber.trim().isEmpty()) supplier.setPhone(mobileNumber.trim());
            supplierRepository.save(supplier);
        }

        // Clear used OTP
        supplierOtpStore.remove(cleanEmail);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Supplier Registration Completed Successfully!");
        result.put("email", savedUser.getEmail());
        result.put("role", savedUser.getRole());
        return result;
    }
}
