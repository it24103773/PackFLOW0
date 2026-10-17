package com.packflow.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PackFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(PackFlowApplication.class, args);
        System.out.println("==================================================");
        System.out.println(" PackFlow Backend Server started successfully!");
        System.out.println(" URL: http://localhost:8080");
        System.out.println(" Tagline: Smart Packaging Management Solutions");
        System.out.println("==================================================");
    }
}
