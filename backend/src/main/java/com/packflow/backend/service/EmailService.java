package com.packflow.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:notifications@packflow.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "PackFlow Supplier Registration - Your 6-Digit OTP Code";
        String content = "Hello,\n\n" +
                "Your OTP verification code for completing PackFlow Supplier Registration is:\n\n" +
                "    " + otpCode + "\n\n" +
                "Please enter this 6-digit verification code on the supplier registration page to set your password.\n\n" +
                "If you did not request this verification code, please ignore this email.\n\n" +
                "Best regards,\n" +
                "PackFlow Security & Administration Team";

        System.out.println("=================================================");
        System.out.println(" [EMAIL SERVICE] Sending OTP email to: " + toEmail);
        System.out.println(" [EMAIL CONTENT] Subject: " + subject);
        System.out.println(" [OTP VERIFICATION CODE]: " + otpCode);
        System.out.println("=================================================");

        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(content);
                mailSender.send(message);
                System.out.println(" [EMAIL SERVICE] Message dispatched via JavaMailSender to " + toEmail);
            } catch (Exception e) {
                System.err.println(" [EMAIL SERVICE NOTE] Live SMTP dispatch failed or unconfigured (" + e.getMessage() + "). Logged OTP to console/response.");
            }
        }
    }
}

