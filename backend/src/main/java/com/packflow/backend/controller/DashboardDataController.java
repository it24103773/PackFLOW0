package com.packflow.backend.controller;

import com.packflow.backend.model.*;
import com.packflow.backend.repository.*;
import com.packflow.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowedHeaders = "*")
public class DashboardDataController {

    private final FileUserRepository userRepository;
    private final FileCustomerRepository customerRepository;
    private final FileProductRepository productRepository;
    private final FileThirdPartyProductRepository thirdPartyProductRepository;
    private final FileOrderRepository orderRepository;
    private final FileInventoryRepository inventoryRepository;
    private final FileInventoryTransactionRepository transactionRepository;
    private final FileSupplierRepository supplierRepository;
    private final FileActivityRepository activityRepository;
    private final FilePackagingTypeRepository packagingTypeRepository;
    private final FileStaffMemberRepository staffMemberRepository;
    private final FileAnnouncementRepository announcementRepository;
    private final FileFeedbackRepository feedbackRepository;
    private final FileOrderHistoryRepository orderHistoryRepository;
    private final FilePaymentRepository paymentRepository;
    private final FileSupplierMaterialHistoryRepository supplierMaterialHistoryRepository;
    private final FilePackagingTaskRepository packagingTaskRepository;
    private final AuthService authService;

    @Autowired
    public DashboardDataController(
            FileUserRepository userRepository,
            FileCustomerRepository customerRepository,
            FileProductRepository productRepository,
            FileThirdPartyProductRepository thirdPartyProductRepository,
            FileOrderRepository orderRepository,
            FileInventoryRepository inventoryRepository,
            FileInventoryTransactionRepository transactionRepository,
            FileSupplierRepository supplierRepository,
            FileActivityRepository activityRepository,
            FilePackagingTypeRepository packagingTypeRepository,
            FileStaffMemberRepository staffMemberRepository,
            FileAnnouncementRepository announcementRepository,
            FileFeedbackRepository feedbackRepository,
            FileOrderHistoryRepository orderHistoryRepository,
            FilePaymentRepository paymentRepository,
            FileSupplierMaterialHistoryRepository supplierMaterialHistoryRepository,
            FilePackagingTaskRepository packagingTaskRepository,
            AuthService authService) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.thirdPartyProductRepository = thirdPartyProductRepository;
        this.orderRepository = orderRepository;
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
        this.supplierRepository = supplierRepository;
        this.activityRepository = activityRepository;
        this.packagingTypeRepository = packagingTypeRepository;
        this.staffMemberRepository = staffMemberRepository;
        this.announcementRepository = announcementRepository;
        this.feedbackRepository = feedbackRepository;
        this.orderHistoryRepository = orderHistoryRepository;
        this.paymentRepository = paymentRepository;
        this.supplierMaterialHistoryRepository = supplierMaterialHistoryRepository;
        this.packagingTaskRepository = packagingTaskRepository;
        this.authService = authService;
    }

    // --- Overview Stats ---
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        List<User> users = userRepository.findAll();
        List<Product> products = productRepository.findAll();
        List<ThirdPartyProduct> thirdPartyProducts = thirdPartyProductRepository.findAll();
        List<PackagingOrder> orders = orderRepository.findAll();
        List<InventoryItem> inventory = inventoryRepository.findAll();
        for (InventoryItem item : inventory) {
            updateItemStatusBasedOnStock(item);
        }
        List<Supplier> suppliers = supplierRepository.findAll();

        long lowStockCount = inventory.stream()
                .filter(i -> "Low Stock".equalsIgnoreCase(i.getStatus()) || "Out of Stock".equalsIgnoreCase(i.getStatus()) || (i.getStockLevel() != null && i.getReorderThreshold() != null && i.getStockLevel() <= i.getReorderThreshold()) || (i.getStockPercentage() != null && i.getStockPercentage() < 20.0))
                .count();

        long activeOrdersCount = orders.stream()
                .filter(o -> !"Completed".equalsIgnoreCase(o.getStatus()))
                .count();

        stats.put("totalUsers", users.size());
        stats.put("totalProducts", products.size());
        stats.put("totalThirdPartyProducts", thirdPartyProducts.size());
        stats.put("totalOrders", orders.size());
        stats.put("activeOrders", activeOrdersCount);
        stats.put("totalInventoryItems", inventory.size());
        stats.put("lowStockAlerts", lowStockCount);
        long registeredSuppliersCount = suppliers.stream()
                .filter(s -> s.getStatus() == null || "REGISTERED".equalsIgnoreCase(s.getStatus()))
                .count();
        stats.put("totalSuppliers", registeredSuppliersCount);
        java.time.LocalDate todayDate = java.time.LocalDate.now();
        long urgentCount = orders.stream().filter(o -> {
            if (o == null) return false;
            String st = o.getStatus() != null ? o.getStatus().toLowerCase() : "";
            if (st.equals("completed") || st.equals("denied") || st.equals("rejected by pm") || st.contains("rejected") || st.contains("waiting for customer") || st.equals("ready for placement")) return false;
            if (o.getStartDate() == null || o.getStartDate().trim().isEmpty() || o.getEndDate() == null || o.getEndDate().trim().isEmpty()) return false;
            String dl = o.getEndDate();
            try {
                java.time.LocalDate d = java.time.LocalDate.parse(dl.split("T")[0]);
                long days = java.time.temporal.ChronoUnit.DAYS.between(todayDate, d);
                return days >= 0 && days <= 7;
            } catch (Exception e) {
                return false;
            }
        }).count();
        stats.put("totalPackagingTypes", packagingTypeRepository.findAll().size());
        stats.put("urgentDeadlines", urgentCount);

        return ResponseEntity.ok(stats);
    }

    // --- Products ---
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(
            @RequestBody Product product,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        Product saved = productRepository.save(product);
        activityRepository.log(
            user != null ? user.getEmail() : "system",
            user != null ? user.getRole() : "Admin",
            "Create Product",
            "Created new packaging product: " + saved.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestBody Product product,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        Product existing = productRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product master record not found"));
        }
        product.setId(id);
        if (product.getCreatedAt() == null) {
            product.setCreatedAt(existing.getCreatedAt());
        }
        Product saved = productRepository.save(product);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Updated Product Master",
            "Updated product master record: " + saved.getName() + " (SKU: " + saved.getSku() + ")"
        );
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        Product existing = productRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));
        }
        boolean deleted = productRepository.deleteById(id);
        if (deleted) {
            activityRepository.log(
                user != null ? user.getEmail() : "admin@packflow.com",
                user != null ? user.getRole() : "System Administrator",
                "Archived Product",
                "Archived product master record: " + existing.getName() + " (SKU: " + existing.getSku() + ")"
            );
            return ResponseEntity.ok(Map.of("message", "Product master record archived successfully"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to delete product"));
    }

    // --- Third-Party Products ---
    @GetMapping("/third-party-products")
    public ResponseEntity<List<ThirdPartyProduct>> getThirdPartyProducts() {
        return ResponseEntity.ok(thirdPartyProductRepository.findAll());
    }

    @PostMapping("/third-party-products")
    public ResponseEntity<?> registerThirdPartyProduct(
            @RequestBody ThirdPartyProduct product,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        ThirdPartyProduct saved = thirdPartyProductRepository.save(product);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Registered 3rd-Party Product",
            "Registered third-party product record: " + saved.getProductName() + " (SKU: " + saved.getSku() + ") from Vendor: " + (saved.getSupplierName() != null ? saved.getSupplierName() : "External Supplier")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/third-party-products/{id}")
    public ResponseEntity<?> updateThirdPartyProduct(
            @PathVariable Long id,
            @RequestBody ThirdPartyProduct product,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        ThirdPartyProduct existing = thirdPartyProductRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Third-party product record not found"));
        }
        product.setId(id);
        if (product.getCreatedAt() == null) {
            product.setCreatedAt(existing.getCreatedAt());
        }
        ThirdPartyProduct saved = thirdPartyProductRepository.save(product);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Updated 3rd-Party Product",
            "Updated third-party product record: " + saved.getProductName() + " (SKU: " + saved.getSku() + ")"
        );
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/third-party-products/convert/{orderId}")
    public ResponseEntity<?> convertOrderToThirdPartyProduct(
            @PathVariable Long orderId,
            @RequestBody(required = false) Map<String, Object> overrides,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingOrder order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Customer order requirement not found"));
        }

        String sku = "3PP-REQ-" + (System.currentTimeMillis() % 10000);
        String thirdPartySku = "CUST-SUB-" + order.getId();
        String supplier = order.getCustomerName() != null ? order.getCustomerName() + " (Customer Submitted)" : "Customer Submitted Requirement";

        ThirdPartyProduct tp = new ThirdPartyProduct(
            null,
            order.getPackagingType() + " Custom Record (" + order.getCustomerName() + ")",
            sku,
            thirdPartySku,
            supplier,
            999L,
            order.getPackagingType(),
            order.getDimensions() != null ? order.getDimensions() : "Standard Spec",
            order.getPrintFinish() != null ? order.getPrintFinish() : "Standard Board",
            2.50,
            order.getQuantity() != null ? order.getQuantity() : 500,
            7,
            "Pending Audit",
            "Active",
            "Converted from customer requirement submission (Order #" + order.getOrderNumber() + "). Notes: " + (order.getNotes() != null ? order.getNotes() : "N/A"),
            null
        );

        if (overrides != null) {
            if (overrides.get("productName") != null) tp.setProductName((String) overrides.get("productName"));
            if (overrides.get("sku") != null) tp.setSku((String) overrides.get("sku"));
            if (overrides.get("supplierName") != null) tp.setSupplierName((String) overrides.get("supplierName"));
            if (overrides.get("notes") != null) tp.setNotes((String) overrides.get("notes"));
        }

        ThirdPartyProduct saved = thirdPartyProductRepository.save(tp);

        // Also update order status to Waiting for Customer Deadline
        order.setStatus("Waiting for Customer Deadline");
        if (order.getProgressPercentage() == null) {
            order.setProgressPercentage(0);
        }
        orderRepository.save(order);

        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Registered 3rd-Party Record from Customer Req",
            "Registered customer-submitted requirement order #" + order.getOrderNumber() + " as third-party product: " + saved.getProductName() + " (SKU: " + saved.getSku() + ")"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/third-party-products/{id}")
    public ResponseEntity<?> deleteThirdPartyProduct(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        ThirdPartyProduct existing = thirdPartyProductRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Third-party product record not found"));
        }
        boolean deleted = thirdPartyProductRepository.deleteById(id);
        if (deleted) {
            activityRepository.log(
                user != null ? user.getEmail() : "admin@packflow.com",
                user != null ? user.getRole() : "System Administrator",
                "Archived 3rd-Party Product",
                "Archived third-party product record: " + existing.getProductName() + " (ID: " + id + ")"
            );
            return ResponseEntity.ok(Map.of("message", "Third-party product record removed successfully"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to delete record"));
    }

    // --- Orders ---
    @GetMapping("/orders")
    public ResponseEntity<List<PackagingOrder>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @GetMapping("/orders/my-orders")
    public ResponseEntity<?> getMyOrders(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        return ResponseEntity.ok(orderRepository.findByCustomerEmail(user.getEmail()));
    }

    @PostMapping("/orders")
    public ResponseEntity<?> submitOrder(
            @RequestBody PackagingOrder order,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user != null) {
            order.setCustomerEmail(user.getEmail());
            order.setCustomerName(user.getFullName());
        } else if (order.getCustomerName() == null || order.getCustomerName().isEmpty()) {
            order.setCustomerName("Guest Customer");
            order.setCustomerEmail("customer@packflow.com");
        }
        if (order.getStatus() == null || order.getStatus().trim().isEmpty() || "Approved".equalsIgnoreCase(order.getStatus())) {
            order.setStatus("Pending");
            order.setProgressPercentage(0);
        }
        PackagingOrder saved = orderRepository.save(
            order,
            "Submitted packaging requirements for order " + (order.getOrderNumber() != null ? order.getOrderNumber() : "") + " (" + order.getPackagingType() + ")",
            user != null ? (user.getFullName() != null ? user.getFullName() : user.getEmail()) : "Customer"
        );
        activityRepository.log(
            order.getCustomerEmail(),
            "Customer",
            "Requirement Submitted",
            "Submitted packaging requirements for order " + saved.getOrderNumber() + " (" + saved.getPackagingType() + ")"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<?> deleteOrder(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }
        boolean deleted = orderRepository.deleteById(id);
        if (deleted) {
            activityRepository.log(
                user != null ? user.getEmail() : "packaging_manager",
                user != null ? user.getRole() : "Packaging Manager",
                "Order Deleted",
                "Deleted production order #" + order.getOrderNumber() + " (" + order.getPackagingType() + ")"
            );
            return ResponseEntity.ok(Map.of("message", "Order removed successfully"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to delete order"));
    }

    @RequestMapping(value = "/orders/{id}/status", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }

        if (payload.containsKey("status")) {
            order.setStatus((String) payload.get("status"));
        }
        if (payload.containsKey("progressPercentage")) {
            order.setProgressPercentage(((Number) payload.get("progressPercentage")).intValue());
        }
        if (payload.containsKey("assignedStaff")) {
            order.setAssignedStaff((String) payload.get("assignedStaff"));
        }

        orderRepository.save(
            order,
            "Updated order " + order.getOrderNumber() + " status to " + order.getStatus() + " (" + order.getProgressPercentage() + "%)",
            user != null ? (user.getFullName() != null ? user.getFullName() : user.getRole()) : "Packaging Manager"
        );
        activityRepository.log(
            user != null ? user.getEmail() : "operator",
            user != null ? user.getRole() : "Packaging Manager",
            "Order Status Updated",
            "Updated order " + order.getOrderNumber() + " status to " + order.getStatus() + " (" + order.getProgressPercentage() + "%)"
        );

        return ResponseEntity.ok(order);
    }

    @RequestMapping(value = "/orders/{id}/assign-staff", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> assignStaffToOrder(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }

        if (payload.containsKey("assignedStaff")) {
            order.setAssignedStaff(payload.get("assignedStaff"));
        }
        if (payload.containsKey("teamLeader")) {
            order.setTeamLeader(payload.get("teamLeader"));
        }
        if (payload.containsKey("teamMembers")) {
            order.setTeamMembers(payload.get("teamMembers"));
        }
        if (payload.containsKey("pmInstructions")) {
            order.setPmInstructions(payload.get("pmInstructions"));
        }
        if (payload.containsKey("member1Task")) {
            order.setMember1Task(payload.get("member1Task"));
        }
        if (payload.containsKey("member2Task")) {
            order.setMember2Task(payload.get("member2Task"));
        }
        if (payload.containsKey("member3Task")) {
            order.setMember3Task(payload.get("member3Task"));
        }
        if (payload.containsKey("member4Task")) {
            order.setMember4Task(payload.get("member4Task"));
        }
        if (payload.containsKey("assignedTasksJson")) {
            order.setAssignedTasksJson(payload.get("assignedTasksJson"));
        }
        if (payload.containsKey("status")) {
            order.setStatus(payload.get("status"));
        } else {
            order.setStatus("In Production (PM Approved)");
        }
        if (order.getProgressPercentage() == null) {
            order.setProgressPercentage(0);
        }

        int memberCount = 0;
        if (order.getTeamMembers() != null && !order.getTeamMembers().trim().isEmpty()) {
            memberCount = order.getTeamMembers().split(",").length;
        }

        orderRepository.save(
            order,
            "Packaging Manager approved order #" + order.getOrderNumber() + " with " + (memberCount > 0 ? memberCount + " staff members" : "staff") + " & individual tasks (Leader: " + (order.getTeamLeader() != null ? order.getTeamLeader() : "N/A") + ")",
            user != null ? (user.getFullName() != null ? user.getFullName() : user.getRole()) : "Packaging Manager"
        );
        activityRepository.log(
            user != null ? user.getEmail() : "packaging_manager",
            "Packaging Manager",
            "Assigned Team & Tasks",
            "Packaging Manager approved order #" + order.getOrderNumber() + " with " + (memberCount > 0 ? memberCount + " staff members" : "staff") + " & individual tasks (Leader: " + order.getTeamLeader() + ")"
        );

        // Reconcile plant tasks in database table "packaing_tasks" (status: Assigned / Unassigned)
        try {
            List<PackagingTask> existingTasks = packagingTaskRepository.findByOrderId(order.getId());
            if (existingTasks == null || existingTasks.isEmpty()) {
                if (order.getOrderNumber() != null) {
                    existingTasks = packagingTaskRepository.findAll().stream()
                        .filter(t -> (t.getOrderId() != null && t.getOrderId().equals(order.getId())) ||
                                     (t.getOrderNumber() != null && t.getOrderNumber().equalsIgnoreCase(order.getOrderNumber())))
                        .collect(Collectors.toList());
                }
            }
            if (existingTasks == null) {
                existingTasks = new ArrayList<>();
            }

            List<Map<String, String>> activeIncoming = new ArrayList<>();
            if (payload.containsKey("assignedTasksJson") && payload.get("assignedTasksJson") != null && !payload.get("assignedTasksJson").trim().isEmpty()) {
                try {
                    List<Map<String, String>> parsedTasks = new ObjectMapper().readValue(payload.get("assignedTasksJson"), new TypeReference<List<Map<String, String>>>() {});
                    for (Map<String, String> item : parsedTasks) {
                        String member = item.getOrDefault("member", item.get("name"));
                        String task = item.get("task");
                        if (member != null && !member.trim().isEmpty()) {
                            Map<String, String> entry = new HashMap<>();
                            entry.put("member", member.trim());
                            entry.put("task", task != null && !task.trim().isEmpty() ? task.trim() : "Assigned packaging task");
                            activeIncoming.add(entry);
                        }
                    }
                } catch (Exception ignored) {}
            }

            if (activeIncoming.isEmpty() && order.getTeamMembers() != null && !order.getTeamMembers().trim().isEmpty()) {
                String[] members = order.getTeamMembers().split(",");
                String[] tasks = { order.getMember1Task(), order.getMember2Task(), order.getMember3Task(), order.getMember4Task() };
                for (int i = 0; i < members.length; i++) {
                    String member = members[i].trim();
                    if (!member.isEmpty()) {
                        String task = (i < tasks.length && tasks[i] != null && !tasks[i].trim().isEmpty()) ? tasks[i].trim() : "General packaging duty";
                        Map<String, String> entry = new HashMap<>();
                        entry.put("member", member);
                        entry.put("task", task);
                        activeIncoming.add(entry);
                    }
                }
            }

            String leader = order.getTeamLeader();
            String instructions = order.getPmInstructions();
            String assignedBy = user != null ? (user.getFullName() != null ? user.getFullName() : user.getRole()) : "Packaging Manager";
            String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

            // 1. Any existing task whose staff member is NOT in active incoming -> set status to "Unassigned"
            for (PackagingTask existing : existingTasks) {
                boolean stillAssigned = false;
                for (Map<String, String> incoming : activeIncoming) {
                    if (isSameStaff(existing.getStaffMember(), incoming.get("member"))) {
                        stillAssigned = true;
                        break;
                    }
                }
                if (!stillAssigned) {
                    existing.setStatus("Unassigned");
                    existing.setTeamLeader(leader);
                    existing.setPmInstructions(instructions);
                    packagingTaskRepository.save(existing);
                }
            }

            // 2. For each incoming member -> update existing task to "Assigned" or create a new task with "Assigned"
            for (Map<String, String> incoming : activeIncoming) {
                String member = incoming.get("member");
                String taskDesc = incoming.get("task");

                List<PackagingTask> matchedList = new ArrayList<>();
                for (PackagingTask existing : existingTasks) {
                    if (isSameStaff(existing.getStaffMember(), member)) {
                        matchedList.add(existing);
                    }
                }

                if (!matchedList.isEmpty()) {
                    for (PackagingTask matched : matchedList) {
                        matched.setStatus("Assigned");
                        matched.setOrderNumber(order.getOrderNumber());
                        matched.setPackagingType(order.getPackagingType());
                        matched.setTeamLeader(leader);
                        matched.setStaffMember(member);
                        matched.setTaskDescription(taskDesc);
                        matched.setPmInstructions(instructions);
                        matched.setAssignedBy(assignedBy);
                        packagingTaskRepository.save(matched);
                    }
                } else {
                    PackagingTask newTask = new PackagingTask(
                        null,
                        order.getId(),
                        order.getOrderNumber(),
                        order.getPackagingType(),
                        leader,
                        member,
                        taskDesc,
                        instructions,
                        "Assigned",
                        assignedBy,
                        now
                    );
                    PackagingTask saved = packagingTaskRepository.save(newTask);
                    existingTasks.add(saved);
                }
            }
        } catch (Exception e) {
            System.err.println("Warning reconciling packaing_tasks table: " + e.getMessage());
        }

        return ResponseEntity.ok(order);
    }

    // --- Packaging Tasks (packaing_tasks) Endpoints ---
    @GetMapping("/packaging-tasks")
    public ResponseEntity<List<PackagingTask>> getAllPackagingTasks() {
        return ResponseEntity.ok(packagingTaskRepository.findAll());
    }

    @GetMapping("/packaging-tasks/order/{orderId}")
    public ResponseEntity<List<PackagingTask>> getPackagingTasksByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(packagingTaskRepository.findByOrderId(orderId));
    }

    @PostMapping("/packaging-tasks")
    public ResponseEntity<?> createPackagingTask(
            @RequestBody PackagingTask task,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (task.getAssignedBy() == null) {
            task.setAssignedBy(user != null ? (user.getFullName() != null ? user.getFullName() : user.getRole()) : "Packaging Manager");
        }
        if (task.getCreatedAt() == null) {
            task.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (task.getStatus() == null || task.getStatus().trim().isEmpty()) {
            task.setStatus("Assigned");
        } else {
            task.setStatus(normalizeTaskStatus(task.getStatus()));
        }
        PackagingTask saved = packagingTaskRepository.save(task);
        syncOrderAfterTaskStatusChange(saved, saved.getStatus());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @RequestMapping(value = "/packaging-tasks/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<?> updatePackagingTaskStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        PackagingTask task = packagingTaskRepository.findById(id).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Task not found"));
        }
        if (payload.containsKey("status")) {
            String newStatus = normalizeTaskStatus(payload.get("status"));
            task.setStatus(newStatus);
            PackagingTask updated = packagingTaskRepository.save(task);
            syncOrderAfterTaskStatusChange(updated, newStatus);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.ok(task);
    }

    @PatchMapping("/packaging-tasks/{id}/unassign")
    public ResponseEntity<?> unassignPackagingTask(@PathVariable Long id) {
        PackagingTask task = packagingTaskRepository.findById(id).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Task not found"));
        }
        task.setStatus("Unassigned");
        PackagingTask updated = packagingTaskRepository.save(task);
        syncOrderAfterTaskStatusChange(updated, "Unassigned");
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/packaging-tasks/{id}/assign")
    public ResponseEntity<?> assignPackagingTask(@PathVariable Long id) {
        PackagingTask task = packagingTaskRepository.findById(id).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Task not found"));
        }
        task.setStatus("Assigned");
        PackagingTask updated = packagingTaskRepository.save(task);
        syncOrderAfterTaskStatusChange(updated, "Assigned");
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/orders/{id}/unassign-staff")
    public ResponseEntity<?> unassignStaffFromOrder(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }
        String memberName = payload.getOrDefault("staffMember", payload.get("member"));
        String taskIdStr = payload.get("taskId");
        if ((memberName == null || memberName.trim().isEmpty()) && (taskIdStr == null || taskIdStr.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(Map.of("message", "staffMember or taskId is required"));
        }

        List<PackagingTask> orderTasks = packagingTaskRepository.findByOrderId(order.getId());
        if (orderTasks == null || orderTasks.isEmpty()) {
            if (order.getOrderNumber() != null) {
                orderTasks = packagingTaskRepository.findAll().stream()
                    .filter(t -> (t.getOrderId() != null && t.getOrderId().equals(order.getId())) ||
                                 (t.getOrderNumber() != null && t.getOrderNumber().equalsIgnoreCase(order.getOrderNumber())))
                    .collect(Collectors.toList());
            }
        }
        if (orderTasks == null) {
            orderTasks = new ArrayList<>();
        }

        PackagingTask matched = null;

        // If taskId is provided, update by exact ID first
        if (taskIdStr != null && !taskIdStr.trim().isEmpty()) {
            try {
                Long taskId = Long.parseLong(taskIdStr.trim());
                for (PackagingTask t : orderTasks) {
                    if (t.getId() != null && t.getId().equals(taskId)) {
                        t.setStatus("Unassigned");
                        packagingTaskRepository.save(t);
                        matched = t;
                    }
                }
                if (matched == null) {
                    PackagingTask direct = packagingTaskRepository.findById(taskId).orElse(null);
                    if (direct != null) {
                        direct.setStatus("Unassigned");
                        packagingTaskRepository.save(direct);
                        matched = direct;
                    }
                }
            } catch (Exception ignored) {}
        }

        // Match by member name across all tasks for this order
        if (memberName != null && !memberName.trim().isEmpty()) {
            for (PackagingTask t : orderTasks) {
                if (isSameStaff(t.getStaffMember(), memberName)) {
                    t.setStatus("Unassigned");
                    packagingTaskRepository.save(t);
                    matched = t;
                }
            }

            // Fallback match across all tasks in table
            if (matched == null) {
                List<PackagingTask> all = packagingTaskRepository.findAll();
                for (PackagingTask t : all) {
                    boolean orderMatches = (t.getOrderId() != null && t.getOrderId().equals(order.getId())) ||
                            (t.getOrderNumber() != null && t.getOrderNumber().equalsIgnoreCase(order.getOrderNumber()));
                    if (orderMatches && isSameStaff(t.getStaffMember(), memberName)) {
                        t.setStatus("Unassigned");
                        packagingTaskRepository.save(t);
                        matched = t;
                    }
                }
            }
        }

        if (matched != null) {
            syncOrderAfterTaskStatusChange(matched, "Unassigned");
        } else {
            // Task record didn't exist yet, create an unassigned record in table
            PackagingTask newTask = new PackagingTask(
                null,
                order.getId(),
                order.getOrderNumber(),
                order.getPackagingType(),
                order.getTeamLeader(),
                memberName != null ? memberName : "Plant Staff",
                "Unassigned packaging duty",
                order.getPmInstructions(),
                "Unassigned",
                "Packaging Manager",
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
            PackagingTask saved = packagingTaskRepository.save(newTask);
            syncOrderAfterTaskStatusChange(saved, "Unassigned");
        }

        PackagingOrder updatedOrder = orderRepository.findById(id).orElse(order);
        return ResponseEntity.ok(Map.of("message", "Staff member unassigned successfully", "order", updatedOrder));
    }

    @PostMapping("/orders/{id}/assign-staff-member")
    public ResponseEntity<?> assignStaffMemberToOrder(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }
        String memberName = payload.getOrDefault("staffMember", payload.get("member"));
        String taskDesc = payload.getOrDefault("task", "Assigned packaging task");
        if (memberName == null || memberName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "staffMember is required"));
        }

        List<PackagingTask> orderTasks = packagingTaskRepository.findByOrderId(order.getId());
        PackagingTask matched = null;
        for (PackagingTask t : orderTasks) {
            if (isSameStaff(t.getStaffMember(), memberName)) {
                t.setStatus("Assigned");
                t.setTaskDescription(taskDesc);
                packagingTaskRepository.save(t);
                matched = t;
                break;
            }
        }

        if (matched == null) {
            matched = new PackagingTask(
                null,
                order.getId(),
                order.getOrderNumber(),
                order.getPackagingType(),
                order.getTeamLeader(),
                memberName,
                taskDesc,
                order.getPmInstructions(),
                "Assigned",
                "Packaging Manager",
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
            matched = packagingTaskRepository.save(matched);
        }

        syncOrderAfterTaskStatusChange(matched, "Assigned");
        PackagingOrder updatedOrder = orderRepository.findById(id).orElse(order);
        return ResponseEntity.ok(Map.of("message", "Staff member assigned successfully", "order", updatedOrder, "task", matched));
    }

    @DeleteMapping("/packaging-tasks/{id}")
    public ResponseEntity<?> deletePackagingTask(@PathVariable Long id) {
        boolean deleted = packagingTaskRepository.deleteById(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Packaging task removed successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Task not found"));
    }

    private boolean isSameStaff(String a, String b) {
        if (a == null || b == null) return false;
        String cleanA = a.trim().toLowerCase();
        String cleanB = b.trim().toLowerCase();
        if (cleanA.equals(cleanB)) return true;

        String baseA = cleanA.contains("(") ? cleanA.substring(0, cleanA.indexOf('(')).trim() : cleanA;
        String baseB = cleanB.contains("(") ? cleanB.substring(0, cleanB.indexOf('(')).trim() : cleanB;
        if (!baseA.isEmpty() && baseA.equals(baseB)) return true;

        if (!baseA.isEmpty() && !baseB.isEmpty()) {
            if (baseA.startsWith(baseB) || baseB.startsWith(baseA)) return true;
            if (baseA.contains(baseB) || baseB.contains(baseA)) return true;
            String firstA = baseA.split("\\s+")[0].replaceAll("[^a-z0-9]", "");
            String firstB = baseB.split("\\s+")[0].replaceAll("[^a-z0-9]", "");
            if (!firstA.isEmpty() && firstA.length() >= 3 && firstA.equals(firstB)) return true;
        }

        // Also check if specialty inside parentheses matches
        String roleA = cleanA.contains("(") && cleanA.contains(")") ? cleanA.substring(cleanA.indexOf('(') + 1, cleanA.indexOf(')')).trim() : "";
        String roleB = cleanB.contains("(") && cleanB.contains(")") ? cleanB.substring(cleanB.indexOf('(') + 1, cleanB.indexOf(')')).trim() : "";
        if (!roleA.isEmpty() && roleA.equals(roleB)) {
            String firstA = baseA.split("\\s+")[0].replaceAll("[^a-z0-9]", "");
            String firstB = baseB.split("\\s+")[0].replaceAll("[^a-z0-9]", "");
            if (!firstA.isEmpty() && (firstA.equals(firstB) || firstA.startsWith(firstB) || firstB.startsWith(firstA))) return true;
        }

        return false;
    }


    private String normalizeTaskStatus(String status) {
        if (status == null) return "Assigned";
        String s = status.trim().toLowerCase();
        if (s.equals("unassign") || s.equals("unassigned")) {
            return "Unassigned";
        }
        if (s.equals("assign") || s.equals("assigned")) {
            return "Assigned";
        }
        return status;
    }

    private void syncOrderAfterTaskStatusChange(PackagingTask task, String newStatus) {
        if (task == null || task.getOrderId() == null) return;
        try {
            PackagingOrder order = orderRepository.findById(task.getOrderId()).orElse(null);
            if (order == null) return;

            String memberName = task.getStaffMember();
            if (memberName == null || memberName.trim().isEmpty()) return;

            List<Map<String, String>> taskList = new ArrayList<>();
            if (order.getAssignedTasksJson() != null && !order.getAssignedTasksJson().trim().isEmpty()) {
                try {
                    taskList = new ObjectMapper().readValue(order.getAssignedTasksJson(), new TypeReference<List<Map<String, String>>>() {});
                } catch (Exception ignored) {}
            }

            List<String> currentMembers = new ArrayList<>();
            if (order.getTeamMembers() != null && !order.getTeamMembers().trim().isEmpty()) {
                for (String m : order.getTeamMembers().split(",")) {
                    if (!m.trim().isEmpty()) currentMembers.add(m.trim());
                }
            }

            if ("Unassigned".equalsIgnoreCase(newStatus)) {
                taskList.removeIf(item -> {
                    String m = item.getOrDefault("member", item.get("name"));
                    return isSameStaff(m, memberName);
                });
                currentMembers.removeIf(m -> isSameStaff(m, memberName));
            } else if ("Assigned".equalsIgnoreCase(newStatus)) {
                boolean foundInJson = false;
                for (Map<String, String> item : taskList) {
                    String m = item.getOrDefault("member", item.get("name"));
                    if (isSameStaff(m, memberName)) {
                        foundInJson = true;
                        if (task.getTaskDescription() != null && !task.getTaskDescription().trim().isEmpty()) {
                            item.put("task", task.getTaskDescription());
                        }
                        break;
                    }
                }
                if (!foundInJson) {
                    Map<String, String> item = new HashMap<>();
                    item.put("member", memberName);
                    item.put("task", task.getTaskDescription() != null ? task.getTaskDescription() : "Assigned packaging task");
                    taskList.add(item);
                }

                boolean foundInMembers = false;
                for (String m : currentMembers) {
                    if (isSameStaff(m, memberName)) {
                        foundInMembers = true;
                        break;
                    }
                }
                if (!foundInMembers) {
                    currentMembers.add(memberName);
                }
            }

            order.setTeamMembers(String.join(", ", currentMembers));
            order.setAssignedTasksJson(new ObjectMapper().writeValueAsString(taskList));
            order.setAssignedStaff("Leader: " + (order.getTeamLeader() != null ? order.getTeamLeader() : "N/A") + " | Team: " + order.getTeamMembers());

            String[] legacy = new String[4];
            for (int i = 0; i < Math.min(4, taskList.size()); i++) {
                legacy[i] = taskList.get(i).get("task");
            }
            order.setMember1Task(legacy[0]);
            order.setMember2Task(legacy[1]);
            order.setMember3Task(legacy[2]);
            order.setMember4Task(legacy[3]);

            orderRepository.save(
                order,
                "Packaging Manager updated staff task status: " + memberName + " -> " + newStatus,
                "Packaging Manager"
            );
        } catch (Exception e) {
            System.err.println("Warning syncing order with task status: " + e.getMessage());
        }
    }


    // --- Staff Members ---
    @GetMapping("/staff")
    public ResponseEntity<List<StaffMember>> getAllStaffMembers() {
        return ResponseEntity.ok(staffMemberRepository.findAll());
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaffMember(
            @RequestBody StaffMember staff,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        StaffMember saved = staffMemberRepository.save(staff);
        activityRepository.log(
            user != null ? user.getEmail() : "packaging_manager",
            user != null ? user.getRole() : "Packaging Manager",
            "Staff Member Registered",
            "Registered new plant staff member: " + saved.getFullName() + " (ID: " + saved.getEmployeeId() + ", Role: " + saved.getRoleSpecialty() + ")"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/staff/{id}")
    public ResponseEntity<?> updateStaffMember(
            @PathVariable Long id,
            @RequestBody StaffMember staff,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        StaffMember existing = staffMemberRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Staff member not found"));
        }
        staff.setId(id);
        if (staff.getCreatedAt() == null) {
            staff.setCreatedAt(existing.getCreatedAt());
        }
        StaffMember saved = staffMemberRepository.save(staff);
        activityRepository.log(
            user != null ? user.getEmail() : "packaging_manager",
            user != null ? user.getRole() : "Packaging Manager",
            "Staff Member Updated",
            "Updated staff member record: " + saved.getFullName() + " (" + saved.getEmployeeId() + ")"
        );
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<?> deleteStaffMember(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        StaffMember existing = staffMemberRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Staff member not found"));
        }
        boolean deleted = staffMemberRepository.deleteById(id);
        if (deleted) {
            // Update any tasks in packaing_tasks table assigned to this staff member to "Unassigned"
            try {
                List<PackagingTask> allTasks = packagingTaskRepository.findAll();
                if (allTasks != null) {
                    for (PackagingTask task : allTasks) {
                        if (isSameStaff(task.getStaffMember(), existing.getFullName())) {
                            task.setStatus("Unassigned");
                            packagingTaskRepository.save(task);
                            syncOrderAfterTaskStatusChange(task, "Unassigned");
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Warning updating packaing_tasks for deleted staff: " + e.getMessage());
            }

            activityRepository.log(
                user != null ? user.getEmail() : "packaging_manager",
                user != null ? user.getRole() : "Packaging Manager",
                "Staff Member Archived",
                "Archived plant staff member record: " + existing.getFullName() + " (ID: " + existing.getEmployeeId() + ")"
            );
            return ResponseEntity.ok(Map.of("message", "Staff member removed successfully"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to remove staff member"));
    }

    @RequestMapping(value = "/orders/{id}/pm-reject", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> rejectOrderByPm(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }

        String reason = payload.getOrDefault("rejectionReason", "Staff not enough for process execution");
        order.setRejectionReason(reason);
        order.setStatus("Rejected by PM");
        order.setProgressPercentage(0);

        // Update all tasks for this order in packaing_tasks table to "Unassigned"
        try {
            List<PackagingTask> orderTasks = packagingTaskRepository.findByOrderId(order.getId());
            if (orderTasks != null) {
                for (PackagingTask task : orderTasks) {
                    task.setStatus("Unassigned");
                    packagingTaskRepository.save(task);
                }
            }
        } catch (Exception e) {
            System.err.println("Warning unassigning tasks on PM reject: " + e.getMessage());
        }

        orderRepository.save(
            order,
            "Packaging Manager rejected order #" + order.getOrderNumber() + ". Reason: " + reason,
            user != null ? (user.getFullName() != null ? user.getFullName() : user.getRole()) : "Packaging Manager"
        );
        activityRepository.log(
            user != null ? user.getEmail() : "packaging_manager",
            "Packaging Manager",
            "Order Process Rejected by PM",
            "Packaging Manager rejected order #" + order.getOrderNumber() + ". Reason: " + reason
        );

        return ResponseEntity.ok(order);
    }

    @RequestMapping(value = "/orders/{id}/customer-deadline", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> updateCustomerDeadline(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            User user = authService.getUserByToken(token);
            PackagingOrder order = orderRepository.findById(id).orElse(null);
            if (order == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
            }

            if (payload.containsKey("targetDeadline") && payload.get("targetDeadline") != null) {
                order.setTargetDeadline(String.valueOf(payload.get("targetDeadline")));
            }
            if (payload.containsKey("customerInstructions") && payload.get("customerInstructions") != null) {
                order.setCustomerInstructions(String.valueOf(payload.get("customerInstructions")));
            }
            if (payload.containsKey("unitPrice") && payload.get("unitPrice") != null) {
                try { order.setUnitPrice(Double.parseDouble(payload.get("unitPrice").toString())); } catch (Exception ignored) {}
            }
            if (payload.containsKey("subtotal") && payload.get("subtotal") != null) {
                try { order.setSubtotal(Double.parseDouble(payload.get("subtotal").toString())); } catch (Exception ignored) {}
            }
            if (payload.containsKey("serviceCharge") && payload.get("serviceCharge") != null) {
                try { order.setServiceCharge(Double.parseDouble(payload.get("serviceCharge").toString())); } catch (Exception ignored) {}
            }
            if (payload.containsKey("totalPrice") && payload.get("totalPrice") != null) {
                try { order.setTotalPrice(Double.parseDouble(payload.get("totalPrice").toString())); } catch (Exception ignored) {}
            }
            if (payload.containsKey("advancePayment") && payload.get("advancePayment") != null) {
                try { order.setAdvancePayment(Double.parseDouble(payload.get("advancePayment").toString())); } catch (Exception ignored) {}
            }
            if (payload.containsKey("remainingBalance") && payload.get("remainingBalance") != null) {
                try { order.setRemainingBalance(Double.parseDouble(payload.get("remainingBalance").toString())); } catch (Exception ignored) {}
            }

            if (payload.containsKey("paymentMethod") && payload.get("paymentMethod") != null) {
                order.setPaymentMethod(String.valueOf(payload.get("paymentMethod")));
            } else {
                order.setPaymentMethod("Visa / Credit Card");
            }

            if (payload.containsKey("paymentSlipUrl") && payload.get("paymentSlipUrl") != null) {
                order.setPaymentSlipUrl(String.valueOf(payload.get("paymentSlipUrl")));
            }

            order.setPaymentRejectionReason(null); // Clear previous rejection on new submission

            if ("Bank Transfer".equalsIgnoreCase(order.getPaymentMethod())) {
                order.setPaymentStatus("Pending Verification");
                order.setAdvancePaidStatus("Pending Verification (Bank Slip Uploaded)");
            } else {
                order.setPaymentStatus("Verified & Accepted");
                order.setAdvancePaidStatus("Paid (40% Advance via Visa)");
            }

            if (payload.containsKey("advancePaidStatus") && payload.get("advancePaidStatus") != null) {
                order.setAdvancePaidStatus(String.valueOf(payload.get("advancePaidStatus")));
            }

            order.setStatus("Ready for Placement");
            if (order.getProgressPercentage() == null) {
                order.setProgressPercentage(0);
            }

            orderRepository.save(
                order,
                "Set deadline (" + order.getTargetDeadline() + ") & submitted 40% advance payment (" + order.getPaymentMethod() + ") for order #" + order.getOrderNumber(),
                user != null ? (user.getFullName() != null ? user.getFullName() : user.getEmail()) : "Customer"
            );
            activityRepository.log(
                user != null ? user.getEmail() : order.getCustomerEmail(),
                "Customer",
                "Deadline & 40% Advance Submitted",
                "Set deadline (" + order.getTargetDeadline() + ") & submitted 40% advance payment (" + order.getPaymentMethod() + ") for order #" + order.getOrderNumber()
            );

            return ResponseEntity.ok(order);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error submitting deadline & payment: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/orders/{id}/verify-payment", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> verifyOrderPayment(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }

        String type = payload.getOrDefault("verificationType", "advance"); // "advance" or "final"
        String status = payload.getOrDefault("status", "Verified & Accepted"); // "Verified & Accepted" or "Rejected"
        String reason = payload.getOrDefault("reason", "Payment slip unreadable or invalid transfer details");

        if ("final".equalsIgnoreCase(type)) {
            if ("Rejected".equalsIgnoreCase(status) || status.toLowerCase().contains("reject")) {
                order.setFinalPaymentStatus("Rejected (Invalid Slip)");
                order.setFinalPaymentRejectionReason(reason);
            } else {
                order.setFinalPaymentStatus("Verified & Accepted");
                order.setFinalPaymentRejectionReason(null);
                order.setStatus("Closed & Fully Paid");
                order.setProgressPercentage(100);
            }
        } else {
            // 40% Advance verification
            if ("Rejected".equalsIgnoreCase(status) || status.toLowerCase().contains("reject")) {
                order.setPaymentStatus("Rejected (Invalid Slip)");
                order.setPaymentRejectionReason(reason);
                order.setAdvancePaidStatus("Payment Rejected by Admin");
            } else {
                order.setPaymentStatus("Verified & Accepted");
                order.setPaymentRejectionReason(null);
                order.setAdvancePaidStatus("Paid (40% Advance - Verified)");
            }
        }

        orderRepository.save(
            order,
            "Handled " + type + " payment verification for order #" + order.getOrderNumber() + ": Status = " + status,
            user != null ? (user.getFullName() != null ? user.getFullName() : user.getRole()) : "System Administrator"
        );
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Payment Verification Handled",
            "Handled " + type + " payment verification for order #" + order.getOrderNumber() + ": Status = " + status
        );

        return ResponseEntity.ok(order);
    }

    @RequestMapping(value = "/orders/{id}/pay-final-balance", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> payFinalBalance(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }

        String method = payload.getOrDefault("finalPaymentMethod", "Visa / Credit Card");
        String slipUrl = payload.get("finalPaymentSlipUrl");

        order.setFinalPaymentMethod(method);
        order.setFinalPaymentSlipUrl(slipUrl);
        order.setFinalPaymentRejectionReason(null);

        if ("Bank Transfer".equalsIgnoreCase(method)) {
            order.setFinalPaymentStatus("Pending Verification");
        } else {
            order.setFinalPaymentStatus("Verified & Accepted");
            order.setStatus("Closed & Fully Paid");
            order.setProgressPercentage(100);
        }

        orderRepository.save(
            order,
            "Submitted 60% final payment (" + method + ") for completed order #" + order.getOrderNumber(),
            user != null ? (user.getFullName() != null ? user.getFullName() : user.getEmail()) : "Customer"
        );
        activityRepository.log(
            user != null ? user.getEmail() : order.getCustomerEmail(),
            "Customer",
            "Final 60% Balance Paid",
            "Submitted 60% final payment (" + method + ") for completed order #" + order.getOrderNumber()
        );

        return ResponseEntity.ok(order);
    }

    @RequestMapping(value = "/orders/{id}/place-and-assign", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> placeAndAssignOrder(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingOrder order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }

        if (payload.containsKey("startDate")) {
            order.setStartDate(payload.get("startDate"));
        }
        if (payload.containsKey("endDate")) {
            order.setEndDate(payload.get("endDate"));
        } else if (order.getTargetDeadline() != null) {
            order.setEndDate(order.getTargetDeadline());
        }
        if (payload.containsKey("assignedManager")) {
            order.setAssignedManager(payload.get("assignedManager"));
        } else {
            order.setAssignedManager("Damsak (Packaging Manager)");
        }
        if (payload.containsKey("pmInstructions")) {
            order.setPmInstructions(payload.get("pmInstructions"));
        }

        order.setStatus("In Progress");
        if (order.getProgressPercentage() == null) {
            order.setProgressPercentage(0);
        }

        orderRepository.save(
            order,
            "Placed order #" + order.getOrderNumber() + " with start date " + order.getStartDate() + ", auto end date " + order.getEndDate() + ", assigned to " + order.getAssignedManager(),
            user != null ? (user.getFullName() != null ? user.getFullName() : user.getRole()) : "System Administrator"
        );
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Placed Order & Assigned Manager",
            "Placed order #" + order.getOrderNumber() + " with start date " + order.getStartDate() + ", auto end date " + order.getEndDate() + ", assigned to " + order.getAssignedManager()
        );

        return ResponseEntity.ok(order);
    }

    // Helper to lookup unit price from Previous Supplied Materials History
    private Double lookupHistoryUnitPrice(String materialName, String category) {
        if (materialName == null || materialName.trim().isEmpty()) return 45.00;
        try {
            List<SupplierMaterialHistory> allHistory = supplierMaterialHistoryRepository.findAll();
            if (allHistory != null) {
                // 1. Exact case-insensitive match
                for (SupplierMaterialHistory h : allHistory) {
                    if (h.getMaterialName() != null && h.getMaterialName().trim().equalsIgnoreCase(materialName.trim())) {
                        if (h.getUnitPrice() != null && h.getUnitPrice() > 0) {
                            return h.getUnitPrice();
                        }
                    }
                }
                // 2. Partial/contains match
                for (SupplierMaterialHistory h : allHistory) {
                    if (h.getMaterialName() != null && (h.getMaterialName().toLowerCase().contains(materialName.toLowerCase()) || materialName.toLowerCase().contains(h.getMaterialName().toLowerCase()))) {
                        if (h.getUnitPrice() != null && h.getUnitPrice() > 0) {
                            return h.getUnitPrice();
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return 45.00;
    }

    // --- Inventory ---
    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryItem>> getInventory() {
        List<InventoryItem> items = inventoryRepository.findAll();
        boolean changed = false;
        // Ensure status reflects current stock percentage (< 20% is low stock) & prices are populated
        for (InventoryItem item : items) {
            updateItemStatusBasedOnStock(item);
            if (item.getUnitPrice() == null || item.getUnitPrice() <= 0) {
                item.setUnitPrice(lookupHistoryUnitPrice(item.getName(), item.getCategory()));
                int qty = item.getPurchasedStock() != null && item.getPurchasedStock() > 0 ? item.getPurchasedStock() : (item.getStockLevel() != null ? item.getStockLevel() : 1000);
                item.setTotalPrice(Math.round(item.getUnitPrice() * qty * 100.0) / 100.0);
                changed = true;
            } else if (item.getTotalPrice() == null || item.getTotalPrice() <= 0) {
                int qty = item.getPurchasedStock() != null && item.getPurchasedStock() > 0 ? item.getPurchasedStock() : (item.getStockLevel() != null ? item.getStockLevel() : 1000);
                item.setTotalPrice(Math.round(item.getUnitPrice() * qty * 100.0) / 100.0);
                changed = true;
            }
            if (item.getPaymentStatus() == null || item.getPaymentStatus().isEmpty()) {
                if ("Accepted".equalsIgnoreCase(item.getStatus()) && item.getSupplierAcceptedAt() != null) {
                    item.setPaymentStatus("Paid");
                } else {
                    item.setPaymentStatus("Unpaid");
                }
                changed = true;
            }
        }
        if (changed) {
            for (InventoryItem item : items) {
                inventoryRepository.save(item);
            }
        }
        return ResponseEntity.ok(items);
    }

    private void updateItemStatusBasedOnStock(InventoryItem item) {
        // If material status is "On-Going" (registered order awaiting supplier acceptance), preserve On-Going status
        if ("On-Going".equalsIgnoreCase(item.getStatus()) || "Ongoing".equalsIgnoreCase(item.getStatus())) {
            return;
        }
        if (item.getStockLevel() == null || item.getStockLevel() <= 0) {
            item.setStatus("Out of Stock");
            return;
        }
        Double pct = item.getStockPercentage();
        boolean isLow = pct < 20.0 || (item.getReorderThreshold() != null && item.getStockLevel() <= item.getReorderThreshold());
        if (isLow) {
            item.setStatus("Low Stock");
        } else if ("Low Stock".equalsIgnoreCase(item.getStatus()) || "Out of Stock".equalsIgnoreCase(item.getStatus()) || item.getStatus() == null || item.getStatus().trim().isEmpty()) {
            item.setStatus("Accepted");
        }
    }

    @PostMapping("/inventory")
    public ResponseEntity<?> addInventoryItem(
            @RequestBody InventoryItem item,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (item.getPurchasedStock() == null || item.getPurchasedStock() <= 0) {
            item.setPurchasedStock(item.getStockLevel() != null ? Math.max(item.getStockLevel(), 100) : 1000);
        }
        // Refer to Previous Supplied Materials History if unit price not explicitly provided
        if (item.getUnitPrice() == null || item.getUnitPrice() <= 0) {
            item.setUnitPrice(lookupHistoryUnitPrice(item.getName(), item.getCategory()));
        }
        int qty = item.getPurchasedStock() != null && item.getPurchasedStock() > 0 ? item.getPurchasedStock() : 1000;
        item.setTotalPrice(Math.round(item.getUnitPrice() * qty * 100.0) / 100.0);
        item.setPaymentStatus("Unpaid");

        // Force status to "On-Going" upon registration until supplier accepts
        item.setStatus("On-Going");
        InventoryItem saved = inventoryRepository.save(item);
        transactionRepository.save(new InventoryTransaction(
            null, null, saved.getId(), saved.getName(), saved.getCategory(),
            "MATERIAL_REGISTERED", saved.getStockLevel(), 0, saved.getStockLevel(),
            saved.getUnit(),
            user != null ? user.getFullName() + " (" + user.getRole() + ")" : "Bihan Silva (Inventory Manager)",
            user != null ? user.getEmail() : "bihanbihan@packflow.com",
            java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            "Registered raw packaging material catalog entry. Status: On-Going."
        ));
        activityRepository.log(
            user != null ? user.getEmail() : "inventory",
            user != null ? user.getRole() : "Inventory Manager",
            "Packaging Material Registered",
            "Registered raw packaging material: " + saved.getName() + " (Category: " + saved.getCategory() + ", Status: On-Going, Stock: " + saved.getStockLevel() + "/" + saved.getPurchasedStock() + " " + saved.getUnit() + ")"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // --- Material History (Table: material_history) ---
    @GetMapping("/material-history")
    public ResponseEntity<List<SupplierMaterialHistory>> getMaterialHistory(
            @RequestParam(required = false) String supplierId) {
        if (supplierId != null && !supplierId.trim().isEmpty()) {
            try {
                Long sId = Long.parseLong(supplierId.trim());
                return ResponseEntity.ok(supplierMaterialHistoryRepository.findBySupplierId(sId));
            } catch (NumberFormatException ignored) {}
        }
        return ResponseEntity.ok(supplierMaterialHistoryRepository.findAll());
    }

    @PostMapping("/material-history")
    public ResponseEntity<?> createMaterialHistory(
            @RequestBody SupplierMaterialHistory history,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (history.getSupplyDate() == null || history.getSupplyDate().trim().isEmpty()) {
            history.setSupplyDate(java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("M/d/yyyy")));
        }
        if (history.getQualityStatus() == null || history.getQualityStatus().trim().isEmpty()) {
            history.setQualityStatus("Supplied & Active");
        }
        SupplierMaterialHistory saved = supplierMaterialHistoryRepository.save(history);
        activityRepository.log(
            user != null ? user.getEmail() : "supplier",
            user != null ? user.getRole() : "Supplier",
            "Material History Updated",
            "Added/Updated material history entry: " + saved.getMaterialName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/material-history/{id}")
    public ResponseEntity<?> deleteMaterialHistory(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        boolean deleted = supplierMaterialHistoryRepository.deleteById(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Material history record deleted"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Record not found"));
    }

    @PatchMapping("/inventory/{id}/accept")
    public ResponseEntity<?> acceptMaterialOrder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        InventoryItem item = inventoryRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Material item not found"));
        }
        item.setStatus("Accepted");
        item.setSupplierAcceptedAt(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        item.setAcceptedNotificationRead(false);

        // Capture Supplier's Bank Details sent while accepting order
        if (payload != null) {
            if (payload.get("bankName") != null && !payload.get("bankName").toString().trim().isEmpty()) {
                item.setBankName(payload.get("bankName").toString().trim());
            }
            if (payload.get("accountHolderName") != null && !payload.get("accountHolderName").toString().trim().isEmpty()) {
                item.setAccountHolderName(payload.get("accountHolderName").toString().trim());
            }
            if (payload.get("accountNumber") != null && !payload.get("accountNumber").toString().trim().isEmpty()) {
                item.setAccountNumber(payload.get("accountNumber").toString().trim());
            }
            if (payload.get("branchName") != null && !payload.get("branchName").toString().trim().isEmpty()) {
                item.setBranchName(payload.get("branchName").toString().trim());
            }
            if (payload.get("swiftCode") != null && !payload.get("swiftCode").toString().trim().isEmpty()) {
                item.setSwiftCode(payload.get("swiftCode").toString().trim());
            }
            if (payload.get("bankNotes") != null) {
                item.setBankNotes(payload.get("bankNotes").toString().trim());
            }
            if (payload.get("unitPrice") != null) {
                try {
                    item.setUnitPrice(Double.parseDouble(payload.get("unitPrice").toString()));
                } catch (Exception ignored) {}
            }
        }

        // Set realistic supplier bank details defaults if missing
        if (item.getBankName() == null || item.getBankName().isEmpty()) {
            item.setBankName("Commercial Bank of Ceylon");
        }
        if (item.getAccountHolderName() == null || item.getAccountHolderName().isEmpty()) {
            item.setAccountHolderName(item.getSupplierName() != null ? item.getSupplierName() + " (Pvt) Ltd" : "Yuthma Global Materials (Pvt) Ltd");
        }
        if (item.getAccountNumber() == null || item.getAccountNumber().isEmpty()) {
            item.setAccountNumber("800129482019");
        }
        if (item.getBranchName() == null || item.getBranchName().isEmpty()) {
            item.setBranchName("Colombo Fort Commercial Branch");
        }
        if (item.getSwiftCode() == null || item.getSwiftCode().isEmpty()) {
            item.setSwiftCode("CCEYLKX");
        }

        // Set payment status as Pending Payment so Inventory Manager can pay via Visa
        item.setPaymentStatus("Pending Payment");

        // Sync unit price and total price referencing Previous Supplied Materials History
        if (item.getUnitPrice() == null || item.getUnitPrice() <= 0) {
            item.setUnitPrice(lookupHistoryUnitPrice(item.getName(), item.getCategory()));
        }
        int qty = item.getPurchasedStock() != null && item.getPurchasedStock() > 0 ? item.getPurchasedStock() : (item.getStockLevel() != null ? item.getStockLevel() : 1000);
        item.setTotalPrice(Math.round(item.getUnitPrice() * qty * 100.0) / 100.0);
        inventoryRepository.save(item);

        // Update fulfillment day and upsert into material_history database table
        String todayFulfillmentDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("M/d/yyyy"));
        List<SupplierMaterialHistory> allHistory = supplierMaterialHistoryRepository.findAll();
        
        SupplierMaterialHistory existingHistory = allHistory.stream()
                .filter(h -> h.getMaterialName() != null && h.getMaterialName().equalsIgnoreCase(item.getName()))
                .findFirst()
                .orElse(null);

        double uPrice = item.getUnitPrice();

        if (existingHistory != null) {
            existingHistory.setSupplyDate(todayFulfillmentDate);
            if (item.getPurchasedStock() != null && item.getPurchasedStock() > 0) {
                existingHistory.setQuantity(item.getPurchasedStock());
            }
            existingHistory.setUnitPrice(uPrice);
            existingHistory.setTotalCost(Math.round(uPrice * existingHistory.getQuantity() * 100.0) / 100.0);
            existingHistory.setQualityStatus("Supplied & Active");
            supplierMaterialHistoryRepository.save(existingHistory);
        } else {
            SupplierMaterialHistory newHistory = new SupplierMaterialHistory();
            newHistory.setSupplierId(1L);
            newHistory.setSupplierName(item.getSupplierName() != null && !item.getSupplierName().isEmpty() ? item.getSupplierName() : "Yuthma Global Materials");
            newHistory.setMaterialName(item.getName());
            newHistory.setCategory(item.getCategory() != null && !item.getCategory().isEmpty() ? item.getCategory() : "General Packaging");
            newHistory.setQuantity(qty);
            newHistory.setUnit(item.getUnit() != null && !item.getUnit().isEmpty() ? item.getUnit() : "Units");
            newHistory.setUnitPrice(uPrice);
            newHistory.setTotalCost(Math.round(uPrice * qty * 100.0) / 100.0);
            newHistory.setSupplyDate(todayFulfillmentDate);
            newHistory.setBatchNumber("MAT-" + String.format("%03d", (allHistory.size() + 1)));
            newHistory.setQualityStatus("Supplied & Active");
            newHistory.setNotes("Order accepted by supplier on " + todayFulfillmentDate + " with Bank Details: " + item.getBankName() + " (" + item.getAccountNumber() + ")");
            supplierMaterialHistoryRepository.save(newHistory);
        }

        transactionRepository.save(new InventoryTransaction(
            null, null, item.getId(), item.getName(), item.getCategory(),
            "SUPPLIER_ACCEPTED", item.getPurchasedStock(), 0, item.getStockLevel(),
            item.getUnit(),
            item.getSupplierName() != null ? item.getSupplierName() + " (Supplier)" : "Yuthma Global Materials (Supplier)",
            item.getSupplierEmail() != null ? item.getSupplierEmail() : "yuthma@packflow.com",
            java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            "Supplier accepted raw material order for " + item.getName() + " with bank details (" + item.getBankName() + " " + item.getAccountNumber() + ") and transferred to IM catalog."
        ));
        activityRepository.log(
            user != null ? user.getEmail() : "supplier",
            user != null ? user.getRole() : "Supplier",
            "Material Order Accepted",
            "Supplier accepted raw material order for " + item.getName() + " with Bank Details: " + item.getBankName() + " (Acc: " + item.getAccountNumber() + ")"
        );
        return ResponseEntity.ok(item);
    }

    // --- Inventory Manager Pay Supplier by Visa Card ---
    @PostMapping("/inventory/{id}/pay-supplier")
    public ResponseEntity<?> paySupplierByVisa(
            @PathVariable Long id,
            @RequestBody Map<String, Object> paymentPayload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        InventoryItem item = inventoryRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Material item not found"));
        }

        String rawCard = paymentPayload.get("cardNumber") != null ? paymentPayload.get("cardNumber").toString().replaceAll("\\s+", "") : "4242";
        String lastFour = rawCard.length() >= 4 ? rawCard.substring(rawCard.length() - 4) : "4242";
        
        Double amount = null;
        if (paymentPayload.get("amount") != null) {
            try {
                amount = Double.parseDouble(paymentPayload.get("amount").toString());
            } catch (Exception ignored) {}
        }
        if (amount == null || amount <= 0) {
            amount = item.getTotalPrice() != null ? item.getTotalPrice() : (item.getUnitPrice() != null ? item.getUnitPrice() * (item.getPurchasedStock() != null ? item.getPurchasedStock() : 1000) : 45000.0);
        }

        String txnId = "TXN-VISA-" + System.currentTimeMillis();
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        item.setPaymentStatus("Paid");
        item.setPaidAt(now);
        item.setPaymentMethod("Visa Card");
        item.setPaymentTransactionId(txnId);
        item.setCardLastFour(lastFour);
        item.setSupplierPaymentNotificationRead(false); // Triggers real-time notification for supplier
        InventoryItem saved = inventoryRepository.save(item);

        transactionRepository.save(new InventoryTransaction(
            null, null, item.getId(), item.getName(), item.getCategory(),
            "SUPPLIER_PAYMENT_VISA", 0, item.getStockLevel(), item.getStockLevel(),
            item.getUnit(),
            user != null ? user.getFullName() + " (" + user.getRole() + ")" : "Bihan Silva (Inventory Manager)",
            user != null ? user.getEmail() : "bihanbihan@packflow.com",
            now,
            "Inventory Manager completed Visa card payment of LKR " + String.format("%.2f", amount) + " to supplier " +
            item.getSupplierName() + " (" + (item.getBankName() != null ? item.getBankName() : "Commercial Bank") +
            " Acc: " + (item.getAccountNumber() != null ? item.getAccountNumber() : "800129482019") +
            "). Visa Card: •••• " + lastFour + ", Txn Ref: " + txnId
        ));

        activityRepository.log(
            user != null ? user.getEmail() : "inventory",
            user != null ? user.getRole() : "Inventory Manager",
            "Supplier Payment Completed (Visa)",
            "Paid LKR " + String.format("%.2f", amount) + " for " + item.getName() + " to supplier " + item.getSupplierName() +
            " via Visa card (Ref: " + txnId + ") into Bank: " + item.getBankName() + " (Acc: " + item.getAccountNumber() + ")"
        );

        return ResponseEntity.ok(Map.of(
            "message", "Payment to supplier completed successfully via Visa Card!",
            "item", saved,
            "transactionId", txnId,
            "amountPaid", amount
        ));
    }

    @PatchMapping("/inventory/{id}/mark-supplier-payment-read")
    public ResponseEntity<?> markSupplierPaymentNotificationRead(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        InventoryItem item = inventoryRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Item not found"));
        }
        item.setSupplierPaymentNotificationRead(true);
        InventoryItem saved = inventoryRepository.save(item);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/inventory/mark-all-supplier-payments-read")
    public ResponseEntity<?> markAllSupplierPaymentsRead(
            @RequestHeader(value = "Authorization", required = false) String token) {
        List<InventoryItem> items = inventoryRepository.findAll();
        for (InventoryItem item : items) {
            if ("Paid".equalsIgnoreCase(item.getPaymentStatus()) && (item.getSupplierPaymentNotificationRead() == null || !item.getSupplierPaymentNotificationRead())) {
                item.setSupplierPaymentNotificationRead(true);
                inventoryRepository.save(item);
            }
        }
        return ResponseEntity.ok(Map.of("message", "All supplier payment notifications marked as read"));
    }

    @PatchMapping("/inventory/{id}/mark-accepted-notification-read")
    public ResponseEntity<?> markAcceptedNotificationRead(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        InventoryItem item = inventoryRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Item not found"));
        }
        item.setAcceptedNotificationRead(true);
        InventoryItem saved = inventoryRepository.save(item);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/inventory/mark-all-accepted-notifications-read")
    public ResponseEntity<?> markAllAcceptedNotificationsRead(
            @RequestHeader(value = "Authorization", required = false) String token) {
        List<InventoryItem> items = inventoryRepository.findAll();
        for (InventoryItem item : items) {
            if ("Accepted".equalsIgnoreCase(item.getStatus()) && (item.getAcceptedNotificationRead() == null || !item.getAcceptedNotificationRead())) {
                item.setAcceptedNotificationRead(true);
                inventoryRepository.save(item);
            }
        }
        return ResponseEntity.ok(Map.of("message", "All supplier acceptance notifications marked as read"));
    }

    @PutMapping("/inventory/{id}")
    public ResponseEntity<?> updateInventoryItem(
            @PathVariable Long id,
            @RequestBody InventoryItem item,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        InventoryItem existing = inventoryRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Inventory item not found"));
        }
        item.setId(id);
        if (item.getPurchasedStock() == null || item.getPurchasedStock() <= 0) {
            item.setPurchasedStock(existing.getPurchasedStock() != null ? existing.getPurchasedStock() : 1000);
        }
        if (item.getStatus() == null || item.getStatus().isEmpty()) {
            item.setStatus(existing.getStatus() != null ? existing.getStatus() : "On-Going");
        }
        // Preserve bank details if omitted
        if (item.getBankName() == null) item.setBankName(existing.getBankName());
        if (item.getAccountHolderName() == null) item.setAccountHolderName(existing.getAccountHolderName());
        if (item.getAccountNumber() == null) item.setAccountNumber(existing.getAccountNumber());
        if (item.getBranchName() == null) item.setBranchName(existing.getBranchName());
        if (item.getSwiftCode() == null) item.setSwiftCode(existing.getSwiftCode());
        if (item.getBankNotes() == null) item.setBankNotes(existing.getBankNotes());
        if (item.getPaymentStatus() == null) item.setPaymentStatus(existing.getPaymentStatus());
        if (item.getPaidAt() == null) item.setPaidAt(existing.getPaidAt());
        if (item.getPaymentMethod() == null) item.setPaymentMethod(existing.getPaymentMethod());
        if (item.getPaymentTransactionId() == null) item.setPaymentTransactionId(existing.getPaymentTransactionId());
        if (item.getCardLastFour() == null) item.setCardLastFour(existing.getCardLastFour());
        if (item.getSupplierPaymentNotificationRead() == null) item.setSupplierPaymentNotificationRead(existing.getSupplierPaymentNotificationRead());
        
        // Sync or recalculate prices
        if (item.getUnitPrice() == null || item.getUnitPrice() <= 0) {
            item.setUnitPrice(existing.getUnitPrice() != null ? existing.getUnitPrice() : lookupHistoryUnitPrice(item.getName(), item.getCategory()));
        }
        int qty = item.getPurchasedStock() != null && item.getPurchasedStock() > 0 ? item.getPurchasedStock() : (item.getStockLevel() != null ? item.getStockLevel() : 1000);
        item.setTotalPrice(Math.round(item.getUnitPrice() * qty * 100.0) / 100.0);

        updateItemStatusBasedOnStock(item);
        InventoryItem saved = inventoryRepository.save(item);
        transactionRepository.save(new InventoryTransaction(
            null, null, saved.getId(), saved.getName(), saved.getCategory(),
            "STOCK_ADJUSTMENT", saved.getStockLevel() - (existing.getStockLevel() != null ? existing.getStockLevel() : 0),
            existing.getStockLevel(), saved.getStockLevel(),
            saved.getUnit(),
            user != null ? user.getFullName() + " (" + user.getRole() + ")" : "Bihan Silva (Inventory Manager)",
            user != null ? user.getEmail() : "bihanbihan@packflow.com",
            java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            "Updated packaging material details and stock configuration."
        ));
        activityRepository.log(
            user != null ? user.getEmail() : "inventory",
            user != null ? user.getRole() : "Inventory Manager",
            "Packaging Material Updated",
            "Updated packaging material details for " + saved.getName()
        );
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/inventory/{id}/stock")
    public ResponseEntity<?> updateStockLevel(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        InventoryItem item = inventoryRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Item not found"));
        }

        Integer newStock = payload.get("stockLevel");
        if (newStock != null) {
            Integer prevStock = item.getStockLevel() != null ? item.getStockLevel() : 0;
            item.setStockLevel(newStock);
            if (payload.containsKey("purchasedStock")) {
                item.setPurchasedStock(payload.get("purchasedStock"));
            }
            updateItemStatusBasedOnStock(item);
            inventoryRepository.save(item);
            
            int diff = newStock - prevStock;
            String tType = diff >= 0 ? "STOCK_IN" : "STOCK_OUT";
            transactionRepository.save(new InventoryTransaction(
                null, null, item.getId(), item.getName(), item.getCategory(),
                tType, diff, prevStock, newStock,
                item.getUnit(),
                user != null ? user.getFullName() + " (" + user.getRole() + ")" : "Bihan Silva (Inventory Manager)",
                user != null ? user.getEmail() : "bihanbihan@packflow.com",
                java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "Manual stock adjustment from " + prevStock + " to " + newStock + " " + item.getUnit()
            ));

            activityRepository.log(
                user != null ? user.getEmail() : "inventory",
                user != null ? user.getRole() : "Inventory Manager",
                "Stock Movement",
                "Adjusted stock level for " + item.getName() + " to " + newStock + "/" + item.getPurchasedStock() + " " + item.getUnit() + " (" + item.getStockPercentage() + "%)"
            );
        }
        return ResponseEntity.ok(item);
    }

    @PostMapping("/inventory/{id}/reorder")
    public ResponseEntity<?> reorderMaterialFromSupplier(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        InventoryItem item = inventoryRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Material item not found"));
        }

        String supplierName = payload.get("supplierName") != null ? payload.get("supplierName").toString() : item.getSupplierName();
        String supplierEmail = payload.get("supplierEmail") != null ? payload.get("supplierEmail").toString() : item.getSupplierEmail();
        Integer reorderQty = payload.get("reorderQuantity") != null ? Integer.parseInt(payload.get("reorderQuantity").toString()) : 1000;
        String notes = payload.get("notes") != null ? payload.get("notes").toString() : "Low stock threshold reorder requested by Inventory Manager.";

        item.setStatus("On-Going");
        if (supplierName != null && !supplierName.isEmpty()) item.setSupplierName(supplierName);
        if (supplierEmail != null && !supplierEmail.isEmpty()) item.setSupplierEmail(supplierEmail);

        if (item.getPurchasedStock() == null || item.getPurchasedStock() <= 0) {
            item.setPurchasedStock((item.getStockLevel() != null ? item.getStockLevel() : 0) + reorderQty);
        } else {
            item.setPurchasedStock(item.getPurchasedStock() + reorderQty);
        }

        InventoryItem saved = inventoryRepository.save(item);
        transactionRepository.save(new InventoryTransaction(
            null, null, item.getId(), item.getName(), item.getCategory(),
            "PURCHASE_REORDER", reorderQty, item.getStockLevel(), item.getPurchasedStock(),
            item.getUnit(),
            user != null ? user.getFullName() + " (" + user.getRole() + ")" : "Bihan Silva (Inventory Manager)",
            user != null ? user.getEmail() : "bihanbihan@packflow.com",
            java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            "Submitted purchase reorder request for " + reorderQty + " " + item.getUnit() + " to supplier " + supplierName + ". Notes: " + notes
        ));

        activityRepository.log(
            user != null ? user.getEmail() : "inventory@packflow.com",
            user != null ? user.getRole() : "Inventory Manager",
            "Supplier Material Reordered",
            "IM submitted reorder purchase request for " + reorderQty + " " + item.getUnit() + " of " + item.getName() + " to supplier " + supplierName + " (" + (supplierEmail != null ? supplierEmail : "N/A") + "). Notes: " + notes
        );

        return ResponseEntity.ok(Map.of(
            "message", "Reorder request sent to supplier successfully!",
            "item", saved
        ));
    }

    @DeleteMapping("/inventory/{id}")
    public ResponseEntity<?> deleteInventoryItem(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        InventoryItem existing = inventoryRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Inventory item not found"));
        }
        boolean deleted = inventoryRepository.deleteById(id);
        if (deleted) {
            transactionRepository.save(new InventoryTransaction(
                null, null, existing.getId(), existing.getName(), existing.getCategory(),
                "MATERIAL_REMOVED", -existing.getStockLevel(), existing.getStockLevel(), 0,
                existing.getUnit(),
                user != null ? user.getFullName() + " (" + user.getRole() + ")" : "Bihan Silva (Inventory Manager)",
                user != null ? user.getEmail() : "bihanbihan@packflow.com",
                java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "Removed material item from active inventory catalog."
            ));
            activityRepository.log(
                user != null ? user.getEmail() : "inventory",
                user != null ? user.getRole() : "Inventory Manager",
                "Packaging Material Removed",
                "Removed raw packaging material from inventory: " + existing.getName() + " (ID: " + id + ")"
            );
            return ResponseEntity.ok(Map.of("message", "Material record removed successfully"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to remove material"));
    }

    @GetMapping("/inventory/transactions")
    public ResponseEntity<List<InventoryTransaction>> getInventoryTransactions(
            @RequestParam(value = "itemId", required = false) Long itemId) {
        if (itemId != null) {
            return ResponseEntity.ok(transactionRepository.findByItemId(itemId));
        }
        return ResponseEntity.ok(transactionRepository.findAll());
    }

    @GetMapping("/inventory/{id}/transactions")
    public ResponseEntity<List<InventoryTransaction>> getItemTransactions(@PathVariable("id") Long id) {
        return ResponseEntity.ok(transactionRepository.findByItemId(id));
    }

    // --- Suppliers ---
    @GetMapping("/suppliers")
    public ResponseEntity<List<Supplier>> getSuppliers() {
        return ResponseEntity.ok(supplierRepository.findAll());
    }

    @PostMapping("/suppliers")
    public ResponseEntity<?> saveSupplier(
            @RequestBody Supplier supplier,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        Supplier saved = supplierRepository.save(supplier);
        activityRepository.log(
            user != null ? user.getEmail() : "supplier",
            user != null ? user.getRole() : "Supplier",
            "Supplier Profile Saved",
            "Saved supplier profile & materials for: " + saved.getCompanyName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<?> deleteSupplier(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        return deleteSupplierInternal(id, token);
    }

    @DeleteMapping("/admin/suppliers/{id}")
    public ResponseEntity<?> deleteAdminSupplier(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        return deleteSupplierInternal(id, token);
    }

    // --- Supplier Previous Material History Endpoints ---
    @GetMapping("/suppliers/material-history")
    public ResponseEntity<List<SupplierMaterialHistory>> getSupplierMaterialHistory(
            @RequestParam(value = "supplierId", required = false) Long supplierId,
            @RequestParam(value = "query", required = false) String query) {
        List<SupplierMaterialHistory> list = supplierId != null ?
                supplierMaterialHistoryRepository.findBySupplierId(supplierId) :
                supplierMaterialHistoryRepository.findAll();

        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase().trim();
            list = list.stream().filter(h ->
                (h.getSupplierName() != null && h.getSupplierName().toLowerCase().contains(q)) ||
                (h.getMaterialName() != null && h.getMaterialName().toLowerCase().contains(q)) ||
                (h.getCategory() != null && h.getCategory().toLowerCase().contains(q)) ||
                (h.getBatchNumber() != null && h.getBatchNumber().toLowerCase().contains(q))
            ).collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(list);
    }

    @PostMapping("/suppliers/material-history")
    public ResponseEntity<?> addSupplierMaterialHistory(
            @RequestBody SupplierMaterialHistory historyData,
            @RequestHeader(value = "Authorization", required = false) String token) {
        if (historyData.getSupplierName() == null || historyData.getMaterialName() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Supplier Name and Material Name are required"));
        }
        if (historyData.getSupplyDate() == null || historyData.getSupplyDate().isEmpty()) {
            historyData.setSupplyDate(java.time.LocalDate.now().toString());
        }
        if (historyData.getTotalCost() == null || historyData.getTotalCost() == 0.0) {
            double price = historyData.getUnitPrice() != null ? historyData.getUnitPrice() : 0.0;
            int qty = historyData.getQuantity() != null ? historyData.getQuantity() : 1;
            historyData.setTotalCost(price * qty);
        }

        SupplierMaterialHistory saved = supplierMaterialHistoryRepository.save(historyData);

        User user = authService.getUserByToken(token);
        activityRepository.log(
            user != null ? user.getEmail() : "system",
            user != null ? user.getRole() : "Admin",
            "Supplier Material History Recorded",
            "Added previous material supply record: " + saved.getMaterialName() + " (" + saved.getQuantity() + " " + saved.getUnit() + ") from " + saved.getSupplierName()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/suppliers/material-history/{id}")
    public ResponseEntity<?> deleteSupplierMaterialHistory(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        boolean deleted = supplierMaterialHistoryRepository.deleteById(id);
        if (deleted) {
            User user = authService.getUserByToken(token);
            activityRepository.log(
                user != null ? user.getEmail() : "system",
                user != null ? user.getRole() : "Admin",
                "Supplier Material History Deleted",
                "Deleted supplier material history record ID: #" + id
            );
            return ResponseEntity.ok(Map.of("message", "Supplier material history record deleted successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Material history record not found"));
        }
    }

    private ResponseEntity<?> deleteSupplierInternal(String id, String token) {
        User user = authService.getUserByToken(token);
        boolean deleted = false;
        String supplierName = id;
        String targetEmail = null;
        Supplier targetSupplier = null;

        try {
            Long numericId = Long.parseLong(id);
            targetSupplier = supplierRepository.findById(numericId).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (targetSupplier == null) {
            targetSupplier = supplierRepository.findByEmail(id).orElse(null);
        }

        if (targetSupplier != null) {
            targetEmail = targetSupplier.getEmail();
            supplierName = targetSupplier.getCompanyName();
        }

        if (targetSupplier != null && targetSupplier.getId() != null) {
            deleted = supplierRepository.deleteById(targetSupplier.getId());
        }
        if (!deleted && targetEmail != null) {
            deleted = supplierRepository.deleteByEmail(targetEmail);
        }
        if (!deleted) {
            try {
                deleted = supplierRepository.deleteById(Long.parseLong(id));
            } catch (Exception ignored) {}
        }

        if (deleted) {
            if (targetEmail != null) {
                User userAcc = userRepository.findByEmail(targetEmail).orElse(null);
                if (userAcc != null) {
                    userAcc.setStatus("REJECTED");
                    userRepository.save(userAcc);
                    authService.invalidateSessionsForUser(userAcc.getEmail());
                }
            }

            activityRepository.log(
                user != null ? user.getEmail() : "admin@packflow.com",
                user != null ? user.getRole() : "System Administrator",
                "Deleted Supplier Record & Logged Out User",
                "Supplier record for '" + supplierName + "' (ID/Email: " + id + ") deleted from Supplier Directory. User session invalidated & logged out."
            );
            return ResponseEntity.ok(Map.of("message", "Supplier record deleted successfully and user logged out from system."));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Supplier record not found for deletion"));
    }

    // --- Activities ---
    @GetMapping("/activities")
    public ResponseEntity<List<ActivityLog>> getActivities() {
        return ResponseEntity.ok(activityRepository.findAll());
    }

    // --- Users ---
    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // --- Packaging Types & Dimension Constraints ---
    @GetMapping("/packaging-types")
    public ResponseEntity<List<PackagingType>> getPackagingTypes() {
        return ResponseEntity.ok(packagingTypeRepository.findAll());
    }

    @PostMapping("/packaging-types")
    public ResponseEntity<?> createPackagingType(
            @RequestBody PackagingType type,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingType saved = packagingTypeRepository.save(type);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Created Packaging Type & Constraints",
            "Created packaging type: " + saved.getTypeName() + " with dimension constraints (L: " + saved.getMinWidthMm() + "-" + saved.getMaxWidthMm() + "mm, W: " + saved.getMinHeightMm() + "-" + saved.getMaxHeightMm() + "mm, H: " + saved.getMinDepthMm() + "-" + saved.getMaxDepthMm() + "mm)"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/packaging-types/{id}")
    public ResponseEntity<?> updatePackagingType(
            @PathVariable Long id,
            @RequestBody PackagingType type,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingType existing = packagingTypeRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Packaging type not found"));
        }
        type.setId(id);
        if (type.getCreatedAt() == null) {
            type.setCreatedAt(existing.getCreatedAt());
        }
        PackagingType saved = packagingTypeRepository.save(type);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Updated Packaging Type Constraints",
            "Updated packaging type: " + saved.getTypeName() + " dimension constraints"
        );
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/packaging-types/{id}")
    public ResponseEntity<?> deletePackagingType(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        PackagingType existing = packagingTypeRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Packaging type not found"));
        }
        boolean deleted = packagingTypeRepository.deleteById(id);
        if (deleted) {
            activityRepository.log(
                user != null ? user.getEmail() : "admin@packflow.com",
                user != null ? user.getRole() : "System Administrator",
                "Archived Packaging Type",
                "Archived packaging type definition: " + existing.getTypeName() + " (ID: " + id + ")"
            );
            return ResponseEntity.ok(Map.of("message", "Packaging type removed successfully"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to delete packaging type"));
    }

    // --- Administrator Customer Management Endpoints ---

    @GetMapping("/admin/customers/pending")
    public ResponseEntity<?> getPendingCustomers() {
        List<User> users = userRepository.findAll();
        List<Customer> customerList = customerRepository.findAll();
        List<PackagingOrder> orders = orderRepository.findAll();

        List<Map<String, Object>> pendingList = new ArrayList<>();

        for (User u : users) {
            if ("Customer".equalsIgnoreCase(u.getRole()) && "PENDING".equalsIgnoreCase(u.getStatus())) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", u.getId());
                item.put("fullName", u.getFullName());
                item.put("email", u.getEmail());
                item.put("mobileNumber", u.getMobileNumber());
                item.put("role", u.getRole());
                item.put("status", u.getStatus());
                item.put("registrationDate", u.getRegistrationDate());

                List<PackagingOrder> custOrders = orders.stream()
                        .filter(o -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(o.getCustomerEmail()))
                        .toList();
                item.put("ordersCount", custOrders.size());
                item.put("latestOrder", custOrders.isEmpty() ? null : custOrders.get(custOrders.size() - 1));
                pendingList.add(item);
            }
        }

        for (Customer c : customerList) {
            if ("PENDING".equalsIgnoreCase(c.getStatus())) {
                boolean exists = pendingList.stream().anyMatch(m -> c.getEmail() != null && c.getEmail().equalsIgnoreCase((String) m.get("email")));
                if (!exists) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", c.getId());
                    item.put("fullName", c.getFullName());
                    item.put("email", c.getEmail());
                    item.put("mobileNumber", c.getMobileNumber());
                    item.put("role", "Customer");
                    item.put("status", c.getStatus());
                    item.put("registrationDate", c.getRegistrationDate());

                    List<PackagingOrder> custOrders = orders.stream()
                            .filter(o -> c.getEmail() != null && c.getEmail().equalsIgnoreCase(o.getCustomerEmail()))
                            .toList();
                    item.put("ordersCount", custOrders.size());
                    item.put("latestOrder", custOrders.isEmpty() ? null : custOrders.get(custOrders.size() - 1));
                    pendingList.add(item);
                }
            }
        }

        return ResponseEntity.ok(pendingList);
    }

    @GetMapping("/admin/customers/records")
    public ResponseEntity<?> getCustomerRecords(@RequestParam(value = "query", required = false) String query) {
        List<User> users = userRepository.findAll();
        List<Customer> customerList = customerRepository.findAll();
        List<PackagingOrder> orders = orderRepository.findAll();

        String q = (query != null) ? query.trim().toLowerCase() : "";

        List<Map<String, Object>> records = new ArrayList<>();

        for (User u : users) {
            if ("Customer".equalsIgnoreCase(u.getRole()) && !"REJECTED".equalsIgnoreCase(u.getStatus()) && !"PENDING".equalsIgnoreCase(u.getStatus())) {
                if (q.isEmpty() ||
                        (u.getFullName() != null && u.getFullName().toLowerCase().contains(q)) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)) ||
                        (u.getMobileNumber() != null && u.getMobileNumber().toLowerCase().contains(q)) ||
                        (u.getStatus() != null && u.getStatus().toLowerCase().contains(q))) {

                    Map<String, Object> item = new HashMap<>();
                    item.put("id", u.getId());
                    item.put("fullName", u.getFullName());
                    item.put("email", u.getEmail());
                    item.put("mobileNumber", u.getMobileNumber());
                    item.put("role", u.getRole());
                    item.put("status", u.getStatus() != null ? u.getStatus() : "REGISTERED");
                    item.put("registrationDate", u.getRegistrationDate());

                    long totalCustOrders = orders.stream()
                            .filter(o -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(o.getCustomerEmail()))
                            .count();
                    item.put("totalOrders", Math.max(totalCustOrders, 1));
                    records.add(item);
                }
            }
        }

        for (Customer c : customerList) {
            if (!"REJECTED".equalsIgnoreCase(c.getStatus()) && !"PENDING".equalsIgnoreCase(c.getStatus())) {
                boolean exists = records.stream().anyMatch(m -> c.getEmail() != null && c.getEmail().equalsIgnoreCase((String) m.get("email")));
                if (!exists) {
                    if (q.isEmpty() ||
                            (c.getFullName() != null && c.getFullName().toLowerCase().contains(q)) ||
                            (c.getEmail() != null && c.getEmail().toLowerCase().contains(q)) ||
                            (c.getMobileNumber() != null && c.getMobileNumber().toLowerCase().contains(q)) ||
                            (c.getStatus() != null && c.getStatus().toLowerCase().contains(q))) {

                        Map<String, Object> item = new HashMap<>();
                        item.put("id", c.getId());
                        item.put("fullName", c.getFullName());
                        item.put("email", c.getEmail());
                        item.put("mobileNumber", c.getMobileNumber());
                        item.put("role", "Customer");
                        item.put("status", c.getStatus() != null ? c.getStatus() : "REGISTERED");
                        item.put("registrationDate", c.getRegistrationDate());

                        long totalCustOrders = orders.stream()
                                .filter(o -> c.getEmail() != null && c.getEmail().equalsIgnoreCase(o.getCustomerEmail()))
                                .count();
                        item.put("totalOrders", c.getTotalOrders() != null && c.getTotalOrders() > 0 ? c.getTotalOrders() : Math.max(totalCustOrders, 1));
                        records.add(item);
                    }
                }
            }
        }

        return ResponseEntity.ok(records);
    }

    @GetMapping("/admin/customers/rejected")
    public ResponseEntity<?> getRejectedCustomers() {
        List<User> users = userRepository.findAll();
        List<Customer> customerList = customerRepository.findAll();
        List<PackagingOrder> orders = orderRepository.findAll();

        List<Map<String, Object>> rejectedList = new ArrayList<>();

        for (User u : users) {
            if ("Customer".equalsIgnoreCase(u.getRole()) && "REJECTED".equalsIgnoreCase(u.getStatus())) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", u.getId());
                item.put("fullName", u.getFullName());
                item.put("email", u.getEmail());
                item.put("mobileNumber", u.getMobileNumber());
                item.put("role", u.getRole());
                item.put("status", u.getStatus());
                item.put("registrationDate", u.getRegistrationDate());

                PackagingOrder rejOrder = orders.stream()
                        .filter(o -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(o.getCustomerEmail()) && ("Denied".equalsIgnoreCase(o.getStatus()) || "Rejected by Admin".equalsIgnoreCase(o.getStatus()) || o.getRejectionReason() != null))
                        .findFirst()
                        .orElse(null);

                item.put("rejectionReason", rejOrder != null && rejOrder.getRejectionReason() != null ? rejOrder.getRejectionReason() : "Order requirement rejected by administrator");
                item.put("rejectedOrder", rejOrder);
                rejectedList.add(item);
            }
        }

        for (Customer c : customerList) {
            if ("REJECTED".equalsIgnoreCase(c.getStatus())) {
                boolean exists = rejectedList.stream().anyMatch(m -> c.getEmail() != null && c.getEmail().equalsIgnoreCase((String) m.get("email")));
                if (!exists) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", c.getId());
                    item.put("fullName", c.getFullName());
                    item.put("email", c.getEmail());
                    item.put("mobileNumber", c.getMobileNumber());
                    item.put("role", "Customer");
                    item.put("status", c.getStatus());
                    item.put("registrationDate", c.getRegistrationDate());

                    PackagingOrder rejOrder = orders.stream()
                            .filter(o -> c.getEmail() != null && c.getEmail().equalsIgnoreCase(o.getCustomerEmail()) && ("Denied".equalsIgnoreCase(o.getStatus()) || "Rejected by Admin".equalsIgnoreCase(o.getStatus()) || o.getRejectionReason() != null))
                            .findFirst()
                            .orElse(null);

                    String reason = c.getRejectionReason() != null ? c.getRejectionReason() : (rejOrder != null && rejOrder.getRejectionReason() != null ? rejOrder.getRejectionReason() : "Order requirement rejected by administrator");
                    item.put("rejectionReason", reason);
                    item.put("rejectedOrder", rejOrder);
                    rejectedList.add(item);
                }
            }
        }

        return ResponseEntity.ok(rejectedList);
    }

    @RequestMapping(value = "/admin/customers/{userId}/approve", method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.GET, RequestMethod.PATCH})
    public ResponseEntity<?> approveAndRegisterCustomer(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User admin = authService.getUserByToken(token);
        User targetUser = userRepository.findById(userId).orElse(null);
        Customer customerRec = customerRepository.findById(userId).orElse(null);

        // Cross-reference by email if null
        if (targetUser == null && customerRec != null && customerRec.getEmail() != null) {
            targetUser = userRepository.findByEmail(customerRec.getEmail()).orElse(null);
        }
        if (customerRec == null && targetUser != null && targetUser.getEmail() != null) {
            customerRec = customerRepository.findByEmail(targetUser.getEmail()).orElse(null);
        }

        if (targetUser == null && customerRec == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Customer not found"));
        }

        String email = targetUser != null ? targetUser.getEmail() : customerRec.getEmail();
        String fullName = targetUser != null ? targetUser.getFullName() : customerRec.getFullName();
        String mobileNumber = targetUser != null ? targetUser.getMobileNumber() : customerRec.getMobileNumber();
        String regDate = targetUser != null ? targetUser.getRegistrationDate() : customerRec.getRegistrationDate();

        if (targetUser != null) {
            targetUser.setStatus("REGISTERED");
            if (targetUser.getRole() == null || targetUser.getRole().isEmpty()) {
                targetUser.setRole("Customer");
            }
            userRepository.save(targetUser);
        } else {
            targetUser = new User(null, fullName, email, "12345678", "Customer", mobileNumber, "REGISTERED", regDate);
            userRepository.save(targetUser);
        }

        // Sync Customer record in customers table
        if (customerRec == null) {
            customerRec = new Customer(null, fullName, email, mobileNumber, "REGISTERED", regDate);
        } else {
            customerRec.setStatus("REGISTERED");
            if (fullName != null) customerRec.setFullName(fullName);
            if (mobileNumber != null) customerRec.setMobileNumber(mobileNumber);
        }
        customerRepository.save(customerRec);

        // Ensure customer order requirement goes to "Pending" status for 1. Customer Packaging Specifications Review Table
        List<PackagingOrder> orders = orderRepository.findByCustomerEmail(email);
        if (orders.isEmpty()) {
            PackagingOrder newOrder = new PackagingOrder();
            newOrder.setOrderNumber("ORD-" + (System.currentTimeMillis() % 10000));
            newOrder.setCustomerName(fullName != null ? fullName : "Registered Customer");
            newOrder.setCustomerEmail(email);
            newOrder.setPackagingType("Corrugated Box");
            newOrder.setDimensions("300 x 200 x 150 mm");
            newOrder.setQuantity(1000);
            newOrder.setPrintFinish("Full Color Offset + Gloss Lamination");
            newOrder.setNotes("Material: Kraft Double Wall B-Flute | Specification requirement generated upon customer registration.");
            newOrder.setStatus("Pending");
            newOrder.setProgressPercentage(0);
            orderRepository.save(newOrder);
        } else {
            for (PackagingOrder o : orders) {
                if ("Pending Admin Registration".equalsIgnoreCase(o.getStatus()) || "Pending".equalsIgnoreCase(o.getStatus())) {
                    o.setStatus("Pending");
                    o.setProgressPercentage(0);
                    orderRepository.save(o);
                }
            }
        }

        activityRepository.log(
            admin != null ? admin.getEmail() : "admin@packflow.com",
            admin != null ? admin.getRole() : "System Administrator",
            "Registered Customer & Spec Transferred",
            "Admin approved and registered customer " + fullName + " (" + email + "). Order specification transferred to Customer Packaging Specifications Review Table."
        );

        return ResponseEntity.ok(Map.of("message", "Customer registered successfully into Customer Records.", "email", email));
    }

    @RequestMapping(value = "/admin/customers/{userId}/reject", method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.GET, RequestMethod.PATCH})
    public ResponseEntity<?> rejectCustomerRequest(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User admin = authService.getUserByToken(token);
        User targetUser = userRepository.findById(userId).orElse(null);
        Customer customerRec = customerRepository.findById(userId).orElse(null);

        if (targetUser == null && customerRec != null && customerRec.getEmail() != null) {
            targetUser = userRepository.findByEmail(customerRec.getEmail()).orElse(null);
        }
        if (customerRec == null && targetUser != null && targetUser.getEmail() != null) {
            customerRec = customerRepository.findByEmail(targetUser.getEmail()).orElse(null);
        }

        if (targetUser == null && customerRec == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Customer not found"));
        }

        String email = targetUser != null ? targetUser.getEmail() : customerRec.getEmail();
        String reason = (payload != null && payload.get("reason") != null) ? payload.get("reason") : "Order requirements do not align with system capabilities";

        if (targetUser != null) {
            targetUser.setStatus("REJECTED");
            userRepository.save(targetUser);
        }

        if (customerRec == null) {
            customerRec = new Customer(null, targetUser != null ? targetUser.getFullName() : "Customer", email, targetUser != null ? targetUser.getMobileNumber() : "", "REJECTED", targetUser != null ? targetUser.getRegistrationDate() : "", reason, null, 0L);
        } else {
            customerRec.setStatus("REJECTED");
            customerRec.setRejectionReason(reason);
        }
        customerRepository.save(customerRec);

        // Update customer's orders to "Denied" / "Rejected by Admin"
        List<PackagingOrder> orders = orderRepository.findByCustomerEmail(email);
        for (PackagingOrder o : orders) {
            o.setStatus("Denied");
            o.setRejectionReason(reason);
            o.setProgressPercentage(0);
            orderRepository.save(o);
        }

        // Invalidate active session for rejected customer so they logout immediately
        if (email != null) {
            authService.invalidateSessionsForUser(email);
        }

        activityRepository.log(
            admin != null ? admin.getEmail() : "admin@packflow.com",
            admin != null ? admin.getRole() : "System Administrator",
            "Customer Registration Rejected",
            "Admin rejected customer " + targetUser.getFullName() + " (" + targetUser.getEmail() + "). Customer logged out and moved to Rejected Customers table. Reason: " + reason
        );

        return ResponseEntity.ok(Map.of("message", "Customer request rejected, logged into Rejected Customers table, and user logged out.", "user", targetUser));
    }

    // --- Administrator Supplier Directory & Inquiry Endpoints ---

    @PostMapping("/public/supplier-inquiry")
    public ResponseEntity<?> submitPublicSupplierInquiry(@RequestBody Map<String, Object> payload) {
        String companyName = (String) payload.getOrDefault("companyName", "Outside Supplier");
        String contactPerson = (String) payload.getOrDefault("contactPerson", "Vendor Representative");
        String email = (String) payload.getOrDefault("email", "supplier@external.com");
        String phone = (String) payload.getOrDefault("phone", "+1 (555) 000-0000");
        String category = (String) payload.getOrDefault("category", "Raw Materials & Inks");
        String message = (String) payload.getOrDefault("inquiryMessage", "Supplier inquiry submitted from main dashboard.");

        List<String> materials = new ArrayList<>();
        if (payload.get("suppliedMaterials") instanceof List) {
            materials = (List<String>) payload.get("suppliedMaterials");
        } else if (payload.get("suppliedMaterials") instanceof String) {
            String matStr = (String) payload.get("suppliedMaterials");
            materials = List.of(matStr.split(","));
        } else {
            materials.add(category);
        }

        Supplier supplier = new Supplier(
            null,
            companyName,
            contactPerson,
            email,
            phone,
            category,
            materials,
            "On Demand",
            5,
            "4.5 / 5.0",
            "PENDING",
            message,
            null,
            (String) payload.getOrDefault("address", "External Vendor Office"),
            java.time.LocalDate.now().toString()
        );

        Supplier saved = supplierRepository.save(supplier);

        activityRepository.log(
            email,
            "Outside Supplier",
            "Send Us a Message Inquiry",
            "Outside supplier inquiry submitted by " + companyName + " (" + email + "). Transferred to Admin Supplier Directory."
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/admin/suppliers/pending")
    public ResponseEntity<?> getPendingSuppliers() {
        List<Supplier> allSuppliers = supplierRepository.findAll();
        List<User> users = userRepository.findAll();

        List<Supplier> pendingList = new ArrayList<>(allSuppliers.stream()
                .filter(s -> "PENDING".equalsIgnoreCase(s.getStatus()))
                .toList());

        // Also check pending Supplier users
        for (User u : users) {
            if ("Supplier".equalsIgnoreCase(u.getRole()) && "PENDING".equalsIgnoreCase(u.getStatus())) {
                boolean alreadyInList = pendingList.stream().anyMatch(s -> u.getEmail().equalsIgnoreCase(s.getEmail()));
                if (!alreadyInList) {
                    Supplier s = new Supplier(
                        null,
                        u.getFullName() != null ? u.getFullName() : "Supplier Company",
                        u.getFullName(),
                        u.getEmail(),
                        u.getMobileNumber() != null ? u.getMobileNumber() : "+1 (555) 000-0000",
                        "Packaging Substrates & Materials",
                        List.of("Corrugated Boards", "Kraft Papers"),
                        "On Demand",
                        5,
                        "4.5 / 5.0",
                        "PENDING",
                        "Supplier registration pending admin verification",
                        null,
                        "Registered Office",
                        u.getRegistrationDate() != null ? u.getRegistrationDate() : java.time.LocalDate.now().toString()
                    );
                    pendingList.add(s);
                }
            }
        }

        return ResponseEntity.ok(pendingList);
    }

    @GetMapping("/admin/suppliers/records")
    public ResponseEntity<?> getSupplierRecords(@RequestParam(value = "query", required = false) String query) {
        List<Supplier> suppliers = supplierRepository.findAll();
        String q = (query != null) ? query.trim().toLowerCase() : "";

        List<Supplier> records = suppliers.stream()
                .filter(s -> !"PENDING".equalsIgnoreCase(s.getStatus()) && !"REJECTED".equalsIgnoreCase(s.getStatus()))
                .filter(s -> q.isEmpty() ||
                        (s.getCompanyName() != null && s.getCompanyName().toLowerCase().contains(q)) ||
                        (s.getContactPerson() != null && s.getContactPerson().toLowerCase().contains(q)) ||
                        (s.getEmail() != null && s.getEmail().toLowerCase().contains(q)) ||
                        (s.getPhone() != null && s.getPhone().toLowerCase().contains(q)) ||
                        (s.getCategory() != null && s.getCategory().toLowerCase().contains(q)) ||
                        (s.getSuppliedMaterials() != null && s.getSuppliedMaterials().toString().toLowerCase().contains(q)))
                .toList();

        return ResponseEntity.ok(records);
    }

    @GetMapping("/admin/suppliers/rejected")
    public ResponseEntity<?> getRejectedSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();
        List<Supplier> rejectedList = suppliers.stream()
                .filter(s -> "REJECTED".equalsIgnoreCase(s.getStatus()))
                .toList();
        return ResponseEntity.ok(rejectedList);
    }

    @PostMapping("/admin/suppliers/{id}/approve")
    public ResponseEntity<?> approveSupplierInquiry(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User admin = authService.getUserByToken(token);
        Supplier supplier = null;

        try {
            Long numericId = Long.parseLong(id);
            supplier = supplierRepository.findAll().stream()
                    .filter(s -> numericId.equals(s.getId()))
                    .findFirst()
                    .orElse(null);
        } catch (NumberFormatException ignored) {}

        if (supplier == null) {
            supplier = supplierRepository.findByEmail(id).orElse(null);
        }

        if (supplier == null) {
            User u = userRepository.findByEmail(id).orElse(null);
            if (u == null) {
                try {
                    Long numId = Long.parseLong(id);
                    u = userRepository.findById(numId).orElse(null);
                } catch (NumberFormatException ignored) {}
            }
            if (u != null) {
                supplier = supplierRepository.findByEmail(u.getEmail()).orElse(null);
                if (supplier == null) {
                    supplier = new Supplier(
                        null,
                        u.getFullName() != null ? u.getFullName() : "Supplier Company",
                        u.getFullName(),
                        u.getEmail(),
                        u.getMobileNumber() != null ? u.getMobileNumber() : "+1 (555) 000-0000",
                        "Packaging Substrates & Materials",
                        List.of("Corrugated Boards", "Kraft Papers"),
                        "In Stock",
                        3,
                        "4.5 / 5.0",
                        "REGISTERED",
                        "Approved supplier inquiry",
                        null,
                        "Registered Office",
                        u.getRegistrationDate() != null ? u.getRegistrationDate() : java.time.LocalDate.now().toString()
                    );
                }
            }
        }

        if (supplier == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Supplier record not found for inquiry ID/Email: " + id));
        }

        supplier.setStatus("REGISTERED");
        supplierRepository.save(supplier);

        // Ensure user account exists so supplier can log in with password
        User existingUser = userRepository.findByEmail(supplier.getEmail()).orElse(null);
        if (existingUser == null) {
            User newUser = new User();
            newUser.setEmail(supplier.getEmail());
            newUser.setFullName(supplier.getCompanyName());
            newUser.setPassword(authService.hashPassword("supplier123"));
            newUser.setRole("Supplier");
            newUser.setStatus("REGISTERED");
            newUser.setMobileNumber(supplier.getPhone());
            userRepository.save(newUser);
        } else {
            existingUser.setStatus("REGISTERED");
            userRepository.save(existingUser);
        }

        activityRepository.log(
            admin != null ? admin.getEmail() : "admin@packflow.com",
            admin != null ? admin.getRole() : "System Administrator",
            "Approved Supplier Registration",
            "Admin approved supplier " + supplier.getCompanyName() + " (" + supplier.getEmail() + "). Logged into Supplier Records table."
        );

        return ResponseEntity.ok(Map.of("message", "Supplier approved and registered into Supplier Records!", "supplier", supplier));
    }

    @PostMapping("/admin/suppliers/{id}/reject")
    public ResponseEntity<?> rejectSupplierInquiry(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User admin = authService.getUserByToken(token);
        Supplier supplier = null;

        try {
            Long numericId = Long.parseLong(id);
            supplier = supplierRepository.findAll().stream()
                    .filter(s -> numericId.equals(s.getId()))
                    .findFirst()
                    .orElse(null);
        } catch (NumberFormatException ignored) {}

        if (supplier == null) {
            supplier = supplierRepository.findByEmail(id).orElse(null);
        }

        if (supplier == null) {
            User u = userRepository.findByEmail(id).orElse(null);
            if (u == null) {
                try {
                    Long numId = Long.parseLong(id);
                    u = userRepository.findById(numId).orElse(null);
                } catch (NumberFormatException ignored) {}
            }
            if (u != null) {
                supplier = supplierRepository.findByEmail(u.getEmail()).orElse(null);
            }
        }

        if (supplier == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Supplier record not found for inquiry ID/Email: " + id));
        }

        String reason = (payload != null && payload.get("rejectionReason") != null)
                ? payload.get("rejectionReason")
                : "Supplier qualifications do not meet active packaging standards";

        supplier.setStatus("REJECTED");
        supplier.setRejectionReason(reason);
        supplierRepository.save(supplier);

        User userAcc = userRepository.findByEmail(supplier.getEmail()).orElse(null);
        if (userAcc != null) {
            userAcc.setStatus("REJECTED");
            userRepository.save(userAcc);
            authService.invalidateSessionsForUser(userAcc.getEmail());
        }

        activityRepository.log(
            admin != null ? admin.getEmail() : "admin@packflow.com",
            admin != null ? admin.getRole() : "System Administrator",
            "Rejected Supplier Request",
            "Admin rejected supplier inquiry for " + supplier.getCompanyName() + " (" + supplier.getEmail() + "). Reason: " + reason
        );

        return ResponseEntity.ok(Map.of("message", "Supplier inquiry rejected and access blocked.", "supplier", supplier));
    }

    @GetMapping("/admin/suppliers/activity")
    public ResponseEntity<?> getSupplierActivityInformation(
            @RequestHeader(value = "Authorization", required = false) String token) {
        List<Supplier> suppliers = supplierRepository.findAll();
        List<ActivityLog> allActivities = activityRepository.findAll();
        List<InventoryTransaction> allTransactions = transactionRepository.findAll();
        List<InventoryItem> allInventory = inventoryRepository.findAll();

        List<Map<String, Object>> supplierActivities = new ArrayList<>();
        int totalRestocksSum = 0;
        int activeMaterialsCount = 0;

        List<Supplier> registeredSuppliers = new ArrayList<>();
        for (Supplier s : suppliers) {
            if (s.getStatus() == null || s.getStatus().equalsIgnoreCase("REGISTERED")) {
                registeredSuppliers.add(s);
            }
        }

        for (Supplier supplier : registeredSuppliers) {
            String suppEmail = supplier.getEmail() != null ? supplier.getEmail().toLowerCase() : "";
            String suppName = supplier.getCompanyName() != null ? supplier.getCompanyName().toLowerCase() : "";

            List<ActivityLog> suppLogs = new ArrayList<>();
            for (ActivityLog log : allActivities) {
                if ((log.getActorEmail() != null && log.getActorEmail().toLowerCase().contains(suppEmail)) ||
                    (log.getDescription() != null && (log.getDescription().toLowerCase().contains(suppName) || log.getDescription().toLowerCase().contains(suppEmail)))) {
                    suppLogs.add(log);
                }
            }

            List<InventoryTransaction> suppTxns = new ArrayList<>();
            for (InventoryTransaction txn : allTransactions) {
                if ((txn.getPerformedBy() != null && (txn.getPerformedBy().toLowerCase().contains(suppName) || txn.getPerformedBy().toLowerCase().contains(suppEmail))) ||
                    (txn.getPerformedByEmail() != null && txn.getPerformedByEmail().toLowerCase().contains(suppEmail)) ||
                    (txn.getNotes() != null && (txn.getNotes().toLowerCase().contains(suppName) || txn.getNotes().toLowerCase().contains(suppEmail)))) {
                    suppTxns.add(txn);
                }
            }

            List<InventoryItem> suppMaterials = new ArrayList<>();
            for (InventoryItem item : allInventory) {
                if ((item.getSupplierEmail() != null && item.getSupplierEmail().equalsIgnoreCase(supplier.getEmail())) ||
                    (item.getSupplierName() != null && supplier.getCompanyName() != null && item.getSupplierName().equalsIgnoreCase(supplier.getCompanyName()))) {
                    suppMaterials.add(item);
                }
            }

            int restocksCount = suppTxns.size() > 0 ? suppTxns.size() : (supplier.getId() != null ? (int)(supplier.getId() * 4 + 3) : 6);
            totalRestocksSum += restocksCount;

            List<String> matList = supplier.getSuppliedMaterials();
            if (matList != null) {
                activeMaterialsCount += matList.size();
            }

            Map<String, Object> suppData = new HashMap<>();
            suppData.put("id", supplier.getId());
            suppData.put("companyName", supplier.getCompanyName());
            suppData.put("contactPerson", supplier.getContactPerson());
            suppData.put("email", supplier.getEmail());
            suppData.put("phone", supplier.getPhone());
            suppData.put("category", supplier.getCategory() != null ? supplier.getCategory() : "Raw Materials & Inks");
            suppData.put("suppliedMaterials", supplier.getSuppliedMaterials() != null ? supplier.getSuppliedMaterials() : List.of("Kraft Paperboard Rolls", "Flexo Inks"));
            suppData.put("status", supplier.getStatus() != null ? supplier.getStatus() : "REGISTERED");
            suppData.put("ratingScore", supplier.getRating() != null ? supplier.getRating().replace(" / 5.0", "") : "4.9");
            suppData.put("reliabilityGrade", "Grade A+ (Verified)");
            suppData.put("averageLeadTime", supplier.getLeadTimeDays() != null ? supplier.getLeadTimeDays() + " Days" : "3 Days");
            suppData.put("registeredDate", supplier.getRegistrationDate() != null ? supplier.getRegistrationDate() : "2026-09-01");
            suppData.put("availabilityStatus", supplier.getAvailabilityStatus() != null ? supplier.getAvailabilityStatus() : "In Stock");
            suppData.put("totalRestocksCompleted", restocksCount);
            suppData.put("activitiesCount", suppLogs.size());
            suppData.put("transactionsCount", suppTxns.size());
            suppData.put("materialsCount", suppMaterials.size());
            suppData.put("recentActivities", suppLogs);
            suppData.put("recentTransactions", suppTxns);

            supplierActivities.add(suppData);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRegisteredSuppliers", registeredSuppliers.size());
        summary.put("totalRestocksCompleted", totalRestocksSum > 0 ? totalRestocksSum : 18);
        summary.put("activeMaterialsSupplied", activeMaterialsCount > 0 ? activeMaterialsCount : 12);
        summary.put("systemRelationshipIndex", "98.5%");

        List<Map<String, Object>> activityLogs = new ArrayList<>();
        for (ActivityLog log : allActivities) {
            Map<String, Object> lMap = new HashMap<>();
            lMap.put("supplierName", log.getActorEmail() != null ? log.getActorEmail() : "System Administrator");
            lMap.put("timestamp", log.getTimestamp() != null ? log.getTimestamp() : "2026-10-03 20:00");
            lMap.put("activityDescription", log.getDescription());
            activityLogs.add(lMap);
        }

        if (activityLogs.isEmpty()) {
            activityLogs.add(Map.of(
                "supplierName", "Yuthma Global Materials",
                "timestamp", "2026-10-03 18:45:00",
                "activityDescription", "Stock Restock: Delivered 500 units of Kraft Paperboard Rolls into main warehouse inventory."
            ));
            activityLogs.add(Map.of(
                "supplierName", "Lanka Coating Solutions",
                "timestamp", "2026-10-03 16:30:00",
                "activityDescription", "Quality Compliance Audit: Passed annual ISO 9001 packaging protective coating compliance check."
            ));
            activityLogs.add(Map.of(
                "supplierName", "System Administrator",
                "timestamp", "2026-10-03 14:15:00",
                "activityDescription", "Supplier Verification: Approved and registered new raw material supplier credentials."
            ));
        }

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("summary", summary);
        responseMap.put("supplierActivities", supplierActivities);
        responseMap.put("suppliersActivity", supplierActivities);
        responseMap.put("activityLogs", activityLogs);
        responseMap.put("totalSuppliers", registeredSuppliers.size());

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping("/suppliers/my-profile")
    public ResponseEntity<?> getMySupplierProfile(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        Supplier profile = supplierRepository.findByEmail(user.getEmail()).orElse(null);
        if (profile == null) {
            profile = new Supplier(
                null,
                user.getFullName() != null ? user.getFullName() : "My Supplier Company",
                user.getFullName(),
                user.getEmail(),
                user.getMobileNumber() != null ? user.getMobileNumber() : "+1 (555) 234-5678",
                "Raw Materials & Inks",
                List.of("Kraft Flute Sheets", "Aqueous Coatings"),
                "In Stock",
                3,
                "4.8 / 5.0",
                "REGISTERED",
                "Supplier Profile",
                null,
                "Headquarters Industrial Hub",
                java.time.LocalDate.now().toString()
            );
            supplierRepository.save(profile);
        }

        return ResponseEntity.ok(profile);
    }

    @PostMapping("/suppliers/my-profile")
    public ResponseEntity<?> updateMySupplierProfile(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        Supplier profile = null;

        if (payload.get("id") != null) {
            try {
                Long numericId = ((Number) payload.get("id")).longValue();
                profile = supplierRepository.findById(numericId).orElse(null);
            } catch (Exception ignored) {}
        }

        if (profile == null) {
            profile = supplierRepository.findByEmail(user.getEmail()).orElse(null);
        }

        if (profile == null && payload.get("email") != null) {
            profile = supplierRepository.findByEmail((String) payload.get("email")).orElse(null);
        }

        if (profile == null) {
            profile = new Supplier();
            profile.setEmail(user.getEmail());
            profile.setStatus("REGISTERED");
        }

        if (payload.get("id") != null) {
            try {
                profile.setId(((Number) payload.get("id")).longValue());
            } catch (Exception ignored) {}
        }

        if (payload.get("companyName") != null) profile.setCompanyName((String) payload.get("companyName"));
        if (payload.get("contactPerson") != null) profile.setContactPerson((String) payload.get("contactPerson"));
        if (payload.get("email") != null && !((String) payload.get("email")).trim().isEmpty()) {
            String newEmail = ((String) payload.get("email")).trim();
            profile.setEmail(newEmail);
            user.setEmail(newEmail);
        }
        if (payload.get("phone") != null) profile.setPhone((String) payload.get("phone"));
        if (payload.get("category") != null) profile.setCategory((String) payload.get("category"));
        if (payload.get("availabilityStatus") != null) profile.setAvailabilityStatus((String) payload.get("availabilityStatus"));
        if (payload.get("leadTimeDays") != null) profile.setLeadTimeDays(((Number) payload.get("leadTimeDays")).intValue());
        if (payload.get("address") != null) profile.setAddress((String) payload.get("address"));
        if (payload.get("inquiryMessage") != null) profile.setInquiryMessage((String) payload.get("inquiryMessage"));
        if (payload.get("rating") != null) profile.setRating((String) payload.get("rating"));

        if (payload.get("suppliedMaterials") instanceof List) {
            profile.setSuppliedMaterials((List<String>) payload.get("suppliedMaterials"));
        } else if (payload.get("suppliedMaterials") instanceof String) {
            String matStr = (String) payload.get("suppliedMaterials");
            profile.setSuppliedMaterials(List.of(matStr.split(",")));
        }

        Supplier saved = supplierRepository.save(profile);

        // Also update User account details
        if (profile.getContactPerson() != null) {
            user.setFullName(profile.getCompanyName() + " (" + profile.getContactPerson() + ")");
        }
        if (profile.getPhone() != null) {
            user.setMobileNumber(profile.getPhone());
        }
        userRepository.save(user);

        activityRepository.log(
            user.getEmail(),
            "Supplier",
            "Updated Supplier Contact Information",
            "Supplier " + saved.getCompanyName() + " updated contact details, email & material specs."
        );

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/suppliers/my-profile")
    public ResponseEntity<?> deleteMySupplierProfile(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        Supplier profile = supplierRepository.findByEmail(user.getEmail()).orElse(null);
        if (profile != null) {
            supplierRepository.deleteByEmail(user.getEmail());
            if (profile.getId() != null) {
                supplierRepository.deleteById(profile.getId());
            }
        }

        user.setStatus("REJECTED");
        userRepository.save(user);
        authService.invalidateSessionsForUser(user.getEmail());

        activityRepository.log(
            user.getEmail(),
            "Supplier",
            "Deleted Supplier Record & Logged Out",
            "Supplier self-deleted record from system and logged out."
        );

        return ResponseEntity.ok(Map.of("message", "Supplier record deleted successfully and user logged out."));
    }

    // --- Customer Profile Endpoints ---

    @GetMapping("/customers/my-profile")
    public ResponseEntity<?> getMyCustomerProfile(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        Customer customer = customerRepository.findByEmail(user.getEmail()).orElse(null);
        if (customer == null) {
            customer = new Customer(
                null,
                user.getFullName() != null ? user.getFullName() : "Customer",
                user.getEmail(),
                user.getMobileNumber() != null ? user.getMobileNumber() : "",
                user.getStatus() != null ? user.getStatus() : "REGISTERED",
                user.getRegistrationDate(),
                null,
                "",
                0L
            );
            customerRepository.save(customer);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", customer.getId());
        result.put("fullName", user.getFullName() != null ? user.getFullName() : customer.getFullName());
        result.put("email", user.getEmail());
        result.put("mobileNumber", user.getMobileNumber() != null ? user.getMobileNumber() : (customer.getMobileNumber() != null ? customer.getMobileNumber() : ""));
        result.put("address", user.getAddress() != null && !user.getAddress().trim().isEmpty() ? user.getAddress() : (customer.getAddress() != null ? customer.getAddress() : ""));
        result.put("role", user.getRole() != null ? user.getRole() : "Customer");
        result.put("user_role", user.getRole() != null ? user.getRole() : "Customer");
        result.put("status", user.getStatus() != null ? user.getStatus() : "REGISTERED");
        result.put("registrationDate", user.getRegistrationDate() != null ? user.getRegistrationDate() : (customer.getRegistrationDate() != null ? customer.getRegistrationDate() : ""));
        result.put("totalOrders", customer.getTotalOrders() != null ? customer.getTotalOrders() : 0L);

        return ResponseEntity.ok(result);
    }

    @RequestMapping(value = "/customers/my-profile", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> updateMyCustomerProfile(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        Customer customer = customerRepository.findByEmail(user.getEmail()).orElse(null);
        if (customer == null) {
            customer = new Customer(
                null,
                user.getFullName(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getStatus() != null ? user.getStatus() : "REGISTERED",
                user.getRegistrationDate(),
                null,
                user.getAddress() != null ? user.getAddress() : "",
                0L
            );
        }

        if (payload.get("fullName") != null && !((String) payload.get("fullName")).trim().isEmpty()) {
            String newName = ((String) payload.get("fullName")).trim();
            user.setFullName(newName);
            customer.setFullName(newName);
        }

        if (payload.get("mobileNumber") != null) {
            String newMobile = ((String) payload.get("mobileNumber")).trim();
            user.setMobileNumber(newMobile);
            customer.setMobileNumber(newMobile);
        }

        if (payload.get("address") != null) {
            String newAddress = ((String) payload.get("address")).trim();
            user.setAddress(newAddress);
            customer.setAddress(newAddress);
        }

        if (payload.get("password") != null && !((String) payload.get("password")).trim().isEmpty()) {
            String newPass = ((String) payload.get("password")).trim();
            if (newPass.length() < 8) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Password must be at least 8 characters long"));
            }
            user.setPassword(newPass);
        }

        if (user.getRole() == null || user.getRole().trim().isEmpty()) {
            user.setRole("Customer");
        }

        userRepository.save(user);
        customerRepository.save(customer);

        activityRepository.log(
            user.getEmail(),
            user.getRole() != null ? user.getRole() : "Customer",
            "Updated Customer Profile Information",
            "Customer " + user.getFullName() + " (" + user.getEmail() + ") updated profile information."
        );

        Map<String, Object> result = new HashMap<>();
        result.put("id", customer.getId());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("mobileNumber", user.getMobileNumber());
        result.put("address", user.getAddress() != null ? user.getAddress() : customer.getAddress());
        result.put("role", user.getRole());
        result.put("user_role", user.getRole());
        result.put("status", user.getStatus());
        result.put("registrationDate", user.getRegistrationDate());
        result.put("totalOrders", customer.getTotalOrders());

        return ResponseEntity.ok(Map.of(
            "message", "Customer Profile updated successfully",
            "user", result
        ));
    }

    // --- Announcements ---
    @GetMapping("/announcements")
    public ResponseEntity<List<Announcement>> getAnnouncements() {
        return ResponseEntity.ok(announcementRepository.findAll());
    }

    @PostMapping("/announcements")
    public ResponseEntity<?> createAnnouncement(
            @RequestBody Announcement announcement,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (announcement.getAuthor() == null || announcement.getAuthor().trim().isEmpty()) {
            announcement.setAuthor(user != null ? user.getFullName() + " (" + user.getRole() + ")" : "System Administrator");
        }
        if (announcement.getTargetAudience() == null || announcement.getTargetAudience().trim().isEmpty()) {
            announcement.setTargetAudience("All");
        }
        if (announcement.getPriority() == null || announcement.getPriority().trim().isEmpty()) {
            announcement.setPriority("Normal");
        }
        Announcement saved = announcementRepository.save(announcement);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Published Announcement",
            "Published announcement: '" + saved.getTitle() + "' targeted to " + saved.getTargetAudience()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<?> deleteAnnouncement(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        boolean deleted = announcementRepository.deleteById(id);
        if (deleted) {
            activityRepository.log(
                user != null ? user.getEmail() : "admin@packflow.com",
                user != null ? user.getRole() : "System Administrator",
                "Deleted Announcement",
                "Removed announcement ID #" + id
            );
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Announcement not found"));
    }

    // --- Feedbacks ---
    @GetMapping("/feedbacks")
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackRepository.findAll());
    }

    @GetMapping("/feedbacks/my-feedbacks")
    public ResponseEntity<?> getMyFeedbacks(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        return ResponseEntity.ok(feedbackRepository.findByCustomerEmail(user.getEmail()));
    }

    @PostMapping("/feedbacks")
    public ResponseEntity<?> submitFeedback(
            @RequestBody Feedback feedback,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user != null) {
            feedback.setCustomerEmail(user.getEmail());
            feedback.setCustomerName(user.getFullName());
        } else if (feedback.getCustomerEmail() == null || feedback.getCustomerEmail().isEmpty()) {
            feedback.setCustomerEmail("customer@packflow.com");
            feedback.setCustomerName("Guest Customer");
        }
        feedback.setStatus("Pending Response");
        Feedback saved = feedbackRepository.save(feedback);
        activityRepository.log(
            saved.getCustomerEmail(),
            "Customer",
            "Submitted Feedback",
            "Submitted customer feedback: '" + saved.getSubject() + "' (Rating: " + saved.getRating() + "/5)"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/feedbacks/{id}/respond")
    public ResponseEntity<?> respondToFeedback(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        Feedback feedback = feedbackRepository.findById(id).orElse(null);
        if (feedback == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Feedback not found"));
        }

        String responseText = payload.get("adminResponse");
        if (responseText == null || responseText.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Response message cannot be empty"));
        }

        feedback.setAdminResponse(responseText.trim());
        feedback.setStatus("Responded");
        feedback.setRespondedBy(user != null ? user.getFullName() + " (" + user.getRole() + ")" : "System Administrator");
        feedback.setRespondedAt(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        Feedback saved = feedbackRepository.save(feedback);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Responded to Customer Feedback",
            "Admin responded to customer feedback #" + id + " from " + saved.getCustomerName()
        );

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/feedbacks/{id}")
    public ResponseEntity<?> deleteFeedback(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        Feedback feedback = feedbackRepository.findById(id).orElse(null);
        if (feedback == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Feedback not found"));
        }

        feedbackRepository.deleteById(id);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Deleted Customer Feedback",
            "Admin deleted customer feedback #" + id + " from " + feedback.getCustomerName()
        );

        return ResponseEntity.ok(Map.of("message", "Feedback deleted successfully", "id", id));
    }

    // --- Order History ---
    @GetMapping("/orders/history")
    public ResponseEntity<List<OrderHistory>> getAllOrderHistory() {
        return ResponseEntity.ok(orderHistoryRepository.findAll());
    }

    @GetMapping("/orders/my-history")
    public ResponseEntity<?> getMyOrderHistory(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        return ResponseEntity.ok(orderHistoryRepository.findByCustomerEmail(user.getEmail()));
    }

    // --- Payments ---
    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentRepository.findAll());
    }

    @GetMapping("/payments/my-payments")
    public ResponseEntity<?> getMyPayments(@RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        return ResponseEntity.ok(paymentRepository.findByCustomerEmail(user.getEmail()));
    }

    @PostMapping("/payments")
    public ResponseEntity<?> submitPayment(
            @RequestBody Payment payment,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        if (user != null) {
            payment.setCustomerEmail(user.getEmail());
            payment.setCustomerName(user.getFullName());
        }
        if (payment.getPaymentStatus() == null || payment.getPaymentStatus().trim().isEmpty()) {
            payment.setPaymentStatus("Pending Verification");
        }
        Payment saved = paymentRepository.save(payment);
        activityRepository.log(
            saved.getCustomerEmail() != null ? saved.getCustomerEmail() : "customer@packflow.com",
            "Customer",
            "Submitted Payment",
            "Submitted payment #" + saved.getPaymentCode() + " of LKR " + saved.getAmount() + " (" + saved.getPaymentType() + ")"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/payments/{id}/status")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User user = authService.getUserByToken(token);
        Payment payment = paymentRepository.findById(id).orElse(null);
        if (payment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Payment record not found"));
        }

        String newStatus = payload.get("paymentStatus");
        String rejectionReason = payload.get("rejectionReason");

        if (newStatus != null && !newStatus.trim().isEmpty()) {
            payment.setPaymentStatus(newStatus.trim());
        }
        if (rejectionReason != null) {
            payment.setRejectionReason(rejectionReason.trim());
        }

        Payment updated = paymentRepository.save(payment);
        activityRepository.log(
            user != null ? user.getEmail() : "admin@packflow.com",
            user != null ? user.getRole() : "System Administrator",
            "Updated Payment Status",
            "Updated payment #" + id + " status to '" + updated.getPaymentStatus() + "'"
        );
        return ResponseEntity.ok(updated);
    }
}


