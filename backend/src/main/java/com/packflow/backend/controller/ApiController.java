package com.packflow.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("app", "PackFlow");
        status.put("tagline", "Smart Packaging Management Solutions");
        status.put("status", "UP");
        status.put("version", "1.0.0");
        status.put("port", 8080);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, String>> getSystemInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("name", "PackFlow Packaging Management System");
        info.put("description", "Centralized digital management platform for packaging companies");
        info.put("futureModules", "Authentication, Dashboard, Inventory, Orders, Products, Suppliers, Customers, Reports");
        return ResponseEntity.ok(info);
    }

    @GetMapping("/services")
    public ResponseEntity<List<Map<String, String>>> getPackagingServices() {
        List<Map<String, String>> services = List.of(
            Map.of("id", "packaging", "name", "Packaging", "desc", "Custom corrugated boxes & industrial packaging"),
            Map.of("id", "printing", "name", "Printing", "desc", "Offset & digital commercial printing"),
            Map.of("id", "coating", "name", "Coating", "desc", "UV varnish, aqueous coating & protective laminations"),
            Map.of("id", "post-press", "name", "Post Press", "desc", "Die-cutting, embossing, foil stamping & folding")
        );
        return ResponseEntity.ok(services);
    }
}
