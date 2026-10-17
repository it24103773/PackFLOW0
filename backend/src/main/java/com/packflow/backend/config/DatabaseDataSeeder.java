package com.packflow.backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.packflow.backend.model.*;
import com.packflow.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class DatabaseDataSeeder implements CommandLineRunner {

    private final JpaUserRepository userRepository;
    private final JpaCustomerRepository customerRepository;
    private final JpaActivityLogRepository activityLogRepository;
    private final JpaInventoryRepository inventoryRepository;
    private final JpaOrderRepository orderRepository;
    private final JpaPackagingTypeRepository packagingTypeRepository;
    private final JpaProductRepository productRepository;
    private final JpaSupplierRepository supplierRepository;
    private final JpaThirdPartyProductRepository thirdPartyProductRepository;
    private final JpaAnnouncementRepository announcementRepository;
    private final JpaFeedbackRepository feedbackRepository;
    private final JpaOrderHistoryRepository orderHistoryRepository;
    private final JpaInventoryTransactionRepository inventoryTransactionRepository;
    private final JpaPaymentRepository paymentRepository;
    private final JpaSupplierMaterialHistoryRepository supplierMaterialHistoryRepository;
    private final JpaPackagingTaskRepository packagingTaskRepository;

    private final FileUserRepository fileUserRepository;
    private final FileCustomerRepository fileCustomerRepository;
    private final FileActivityRepository fileActivityRepository;
    private final FileInventoryRepository fileInventoryRepository;
    private final FileOrderRepository fileOrderRepository;
    private final FilePackagingTypeRepository filePackagingTypeRepository;
    private final FileProductRepository fileProductRepository;
    private final FileSupplierRepository fileSupplierRepository;
    private final FileThirdPartyProductRepository fileThirdPartyProductRepository;
    private final FileAnnouncementRepository fileAnnouncementRepository;
    private final FileFeedbackRepository fileFeedbackRepository;
    private final FileOrderHistoryRepository fileOrderHistoryRepository;
    private final FileInventoryTransactionRepository fileInventoryTransactionRepository;
    private final FilePaymentRepository filePaymentRepository;
    private final FilePackagingTaskRepository filePackagingTaskRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public DatabaseDataSeeder(
            JpaUserRepository userRepository,
            JpaCustomerRepository customerRepository,
            JpaActivityLogRepository activityLogRepository,
            JpaInventoryRepository inventoryRepository,
            JpaOrderRepository orderRepository,
            JpaPackagingTypeRepository packagingTypeRepository,
            JpaProductRepository productRepository,
            JpaSupplierRepository supplierRepository,
            JpaThirdPartyProductRepository thirdPartyProductRepository,
            JpaAnnouncementRepository announcementRepository,
            JpaFeedbackRepository feedbackRepository,
            JpaOrderHistoryRepository orderHistoryRepository,
            JpaInventoryTransactionRepository inventoryTransactionRepository,
            JpaPaymentRepository paymentRepository,
            JpaSupplierMaterialHistoryRepository supplierMaterialHistoryRepository,
            JpaPackagingTaskRepository packagingTaskRepository,
            FileUserRepository fileUserRepository,
            FileCustomerRepository fileCustomerRepository,
            FileActivityRepository fileActivityRepository,
            FileInventoryRepository fileInventoryRepository,
            FileOrderRepository fileOrderRepository,
            FilePackagingTypeRepository filePackagingTypeRepository,
            FileProductRepository fileProductRepository,
            FileSupplierRepository fileSupplierRepository,
            FileThirdPartyProductRepository fileThirdPartyProductRepository,
            FileAnnouncementRepository fileAnnouncementRepository,
            FileFeedbackRepository fileFeedbackRepository,
            FileOrderHistoryRepository fileOrderHistoryRepository,
            FileInventoryTransactionRepository fileInventoryTransactionRepository,
            FilePaymentRepository filePaymentRepository,
            FilePackagingTaskRepository filePackagingTaskRepository) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.activityLogRepository = activityLogRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderRepository = orderRepository;
        this.packagingTypeRepository = packagingTypeRepository;
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
        this.thirdPartyProductRepository = thirdPartyProductRepository;
        this.announcementRepository = announcementRepository;
        this.feedbackRepository = feedbackRepository;
        this.orderHistoryRepository = orderHistoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.paymentRepository = paymentRepository;
        this.supplierMaterialHistoryRepository = supplierMaterialHistoryRepository;

        this.fileUserRepository = fileUserRepository;
        this.fileCustomerRepository = fileCustomerRepository;
        this.fileActivityRepository = fileActivityRepository;
        this.fileInventoryRepository = fileInventoryRepository;
        this.fileOrderRepository = fileOrderRepository;
        this.filePackagingTypeRepository = filePackagingTypeRepository;
        this.fileProductRepository = fileProductRepository;
        this.fileSupplierRepository = fileSupplierRepository;
        this.fileThirdPartyProductRepository = fileThirdPartyProductRepository;
        this.fileAnnouncementRepository = fileAnnouncementRepository;
        this.fileFeedbackRepository = fileFeedbackRepository;
        this.fileOrderHistoryRepository = fileOrderHistoryRepository;
        this.fileInventoryTransactionRepository = fileInventoryTransactionRepository;
        this.filePaymentRepository = filePaymentRepository;
        this.packagingTaskRepository = packagingTaskRepository;
        this.filePackagingTaskRepository = filePackagingTaskRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("==================================================");
        System.out.println(" Starting PackFlow MySQL Table Data Migration...");
        System.out.println("==================================================");

        seedUsers();
        seedCustomers();
        seedActivities();
        seedInventory();
        seedOrders();
        seedPackagingTypes();
        seedProducts();
        seedSuppliers();
        seedThirdPartyProducts();
        seedAnnouncements();
        seedFeedbacks();
        seedOrderHistory();
        seedInventoryTransactions();
        seedPayments();
        seedSupplierMaterialHistory();
        seedPackagingTasks();

        System.out.println("==================================================");
        System.out.println(" PackFlow MySQL Data Migration Completed!");
        System.out.println("==================================================");
    }

    private void seedCustomers() {
        if (customerRepository.count() == 0) {
            List<Customer> customers = fileCustomerRepository.findAll();
            if (customers != null && !customers.isEmpty()) {
                customerRepository.saveAll(customers);
                System.out.println("✓ Migrated " + customers.size() + " records into table 'customers'");
            }
        } else {
            System.out.println("• Table 'customers' already populated (" + customerRepository.count() + " rows)");
        }
    }

    private void seedUsers() {
        List<User> users = fileUserRepository.findAll();
        if (userRepository.count() == 0) {
            if (users != null && !users.isEmpty()) {
                userRepository.saveAll(users);
                System.out.println("✓ Migrated " + users.size() + " records into table 'users'");
            }
        } else {
            if (users != null) {
                for (User u : users) {
                    if (u.getEmail() != null) {
                        userRepository.findByEmailIgnoreCase(u.getEmail()).ifPresent(dbUser -> {
                            dbUser.setRole(u.getRole());
                            dbUser.setPassword(u.getPassword());
                            dbUser.setAddress(u.getAddress());
                            dbUser.setMobileNumber(u.getMobileNumber());
                            userRepository.save(dbUser);
                        });
                    }
                }
            }
            System.out.println("• Table 'users' synchronized with role & credentials (" + userRepository.count() + " rows)");
        }
    }

    private void seedActivities() {
        if (activityLogRepository.count() == 0) {
            List<ActivityLog> activities = fileActivityRepository.findAll();
            if (activities != null && !activities.isEmpty()) {
                activityLogRepository.saveAll(activities);
                System.out.println("✓ Migrated " + activities.size() + " records into table 'activity_logs'");
            }
        } else {
            System.out.println("• Table 'activity_logs' already populated (" + activityLogRepository.count() + " rows)");
        }
    }

    private void seedInventory() {
        if (inventoryRepository.count() == 0) {
            List<InventoryItem> items = fileInventoryRepository.findAll();
            if (items != null && !items.isEmpty()) {
                inventoryRepository.saveAll(items);
                System.out.println("✓ Migrated " + items.size() + " records into table 'inventory_items'");
            }
        } else {
            System.out.println("• Table 'inventory_items' already populated (" + inventoryRepository.count() + " rows)");
        }
    }

    private void seedOrders() {
        if (orderRepository.count() == 0) {
            List<PackagingOrder> orders = fileOrderRepository.findAll();
            if (orders != null && !orders.isEmpty()) {
                orderRepository.saveAll(orders);
                System.out.println("✓ Migrated " + orders.size() + " records into table 'packaging_orders'");
            }
        } else {
            System.out.println("• Table 'packaging_orders' already populated (" + orderRepository.count() + " rows)");
        }
    }

    private void seedPackagingTypes() {
        if (packagingTypeRepository.count() == 0) {
            List<PackagingType> types = filePackagingTypeRepository.findAll();
            if (types != null && !types.isEmpty()) {
                packagingTypeRepository.saveAll(types);
                System.out.println("✓ Migrated " + types.size() + " records into table 'packaging_types'");
            }
        } else {
            System.out.println("• Table 'packaging_types' already populated (" + packagingTypeRepository.count() + " rows)");
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            List<Product> products = fileProductRepository.findAll();
            if (products != null && !products.isEmpty()) {
                productRepository.saveAll(products);
                System.out.println("✓ Migrated " + products.size() + " records into table 'products'");
            }
        } else {
            System.out.println("• Table 'products' already populated (" + productRepository.count() + " rows)");
        }
    }

    private void seedSuppliers() {
        if (supplierRepository.count() == 0) {
            List<Supplier> suppliers = fileSupplierRepository.findAll();
            if (suppliers != null && !suppliers.isEmpty()) {
                supplierRepository.saveAll(suppliers);
                System.out.println("✓ Migrated " + suppliers.size() + " records into table 'suppliers'");
            }
        } else {
            System.out.println("• Table 'suppliers' already populated (" + supplierRepository.count() + " rows)");
        }
    }

    private void seedThirdPartyProducts() {
        if (thirdPartyProductRepository.count() == 0) {
            List<ThirdPartyProduct> items = fileThirdPartyProductRepository.findAll();
            if (items != null && !items.isEmpty()) {
                thirdPartyProductRepository.saveAll(items);
                System.out.println("✓ Migrated " + items.size() + " records into table 'third_party_products'");
            }
        } else {
            System.out.println("• Table 'third_party_products' already populated (" + thirdPartyProductRepository.count() + " rows)");
        }
    }

    private void seedAnnouncements() {
        if (announcementRepository.count() == 0) {
            List<Announcement> announcements = fileAnnouncementRepository.findAll();
            if (announcements != null && !announcements.isEmpty()) {
                announcementRepository.saveAll(announcements);
                System.out.println("✓ Migrated " + announcements.size() + " records into table 'announcements'");
            }
        } else {
            System.out.println("• Table 'announcements' already populated (" + announcementRepository.count() + " rows)");
        }
    }

    private void seedFeedbacks() {
        if (feedbackRepository.count() == 0) {
            List<Feedback> feedbacks = fileFeedbackRepository.findAll();
            if (feedbacks != null && !feedbacks.isEmpty()) {
                feedbackRepository.saveAll(feedbacks);
                System.out.println("✓ Migrated " + feedbacks.size() + " records into table 'feedbacks'");
            }
        } else {
            System.out.println("• Table 'feedbacks' already populated (" + feedbackRepository.count() + " rows)");
        }
    }

    private void seedOrderHistory() {
        // Sync history from all packaging orders first (ensures every order has a history event)
        List<PackagingOrder> orders = fileOrderRepository.findAll();
        fileOrderHistoryRepository.syncFromOrders(orders);

        // Ensure database table 'order_history' has all records that exist in the file repository
        List<OrderHistory> fileHistories = fileOrderHistoryRepository.findAllFromFile();
        if (fileHistories != null && !fileHistories.isEmpty()) {
            int inserted = 0;
            for (OrderHistory h : fileHistories) {
                if (h.getOrderId() != null && orderHistoryRepository.findByOrderId(h.getOrderId()).isEmpty()) {
                    OrderHistory toSave = new OrderHistory(
                        null,
                        h.getOrderId(),
                        h.getOrderNumber(),
                        h.getCustomerName(),
                        h.getCustomerEmail(),
                        h.getPackagingType(),
                        h.getQuantity(),
                        h.getTotalPrice(),
                        h.getStatus(),
                        h.getProgressPercentage(),
                        h.getEventDescription(),
                        h.getUpdatedBy(),
                        h.getCreatedAt()
                    );
                    orderHistoryRepository.save(toSave);
                    inserted++;
                }
            }
            if (inserted > 0) {
                System.out.println("✓ Synchronized " + inserted + " new/missing records into table 'order_history'");
            }
        }
        System.out.println("• Table 'order_history' populated & synced (" + orderHistoryRepository.count() + " rows)");
    }

    private void seedInventoryTransactions() {
        if (inventoryTransactionRepository.count() == 0) {
            List<InventoryTransaction> txns = fileInventoryTransactionRepository.findAll();
            if (txns != null && !txns.isEmpty()) {
                inventoryTransactionRepository.saveAll(txns);
                System.out.println("✓ Migrated " + txns.size() + " records into table 'inventory_transactions'");
            }
        } else {
            System.out.println("• Table 'inventory_transactions' already populated (" + inventoryTransactionRepository.count() + " rows)");
        }
    }

    private void seedPayments() {
        if (paymentRepository.count() == 0) {
            List<Payment> payments = filePaymentRepository.findAll();
            if (payments != null && !payments.isEmpty()) {
                paymentRepository.saveAll(payments);
                System.out.println("✓ Migrated " + payments.size() + " records into table 'payments'");
            }
        } else {
            System.out.println("• Table 'payments' already populated (" + paymentRepository.count() + " rows)");
        }
    }

    private void seedSupplierMaterialHistory() {
        if (supplierMaterialHistoryRepository.count() == 0) {
            List<SupplierMaterialHistory> historyList = List.of(
                new SupplierMaterialHistory(null, 1L, "Yuthma Global Materials", "Kraft Paperboard Rolls (300 GSM)", "Cardboard & Paperboard", 5000, "Kg", 45.00, 225000.00, "Active Inventory", "MAT-KFT-300", "Supplied & Active", "High opacity 300 GSM kraft rolls for corrugated box production."),
                new SupplierMaterialHistory(null, 2L, "EcoBoard Packaging Supplies", "Corrugated Flute B Sheets", "Cardboard & Paperboard", 1000, "Sheets", 45.00, 45000.00, "Active Inventory", "MAT-FLT-B", "Supplied & Active", "Double-wall B-flute corrugated sheets for shipping boxes."),
                new SupplierMaterialHistory(null, 4L, "Apex Polymer Films Co", "High-Density Polyethylene Film", "Plastics & Films", 1800, "Meters", 45.00, 81000.00, "9/16/2026", "MAT-HDPE-18", "Supplied & Active", "HDPE protective lamination film for outer packaging."),
                new SupplierMaterialHistory(null, 1L, "Yuthma Global Materials", "Heavy Duty Bubble Wrap Roll 100m", "Bubble Wrap & Cushioning", 100, "Rolls", 45.00, 4500.00, "Active Inventory", "MAT-BBL-100", "Supplied & Active", "Shock-absorbing cushioning rolls for fragile item packaging."),
                new SupplierMaterialHistory(null, 3L, "PackTech Adhesives Corp", "Industrial PVA Packaging Adhesive", "Tapes & Adhesives", 5200, "Liters", 45.00, 234000.00, "10/5/2026", "MAT-PVA-52", "Supplied & Active", "High-tack automatic folder-gluer industrial adhesive."),
                new SupplierMaterialHistory(null, 1L, "PrintCraft Inks Ltd", "Cyan Water-Based Flexo Ink", "Labels & Inks", 500, "Liters", 45.00, 22500.00, "9/15/2026", "MAT-INK-CYN", "Supplied & Active", "Water-based cyan flexo printing ink for outer box printing."),
                new SupplierMaterialHistory(null, 2L, "Lanka Coating Solutions", "Amber Glass Jars 250ml", "Glass & Containers", 500, "Boxes", 45.00, 22500.00, "Active Inventory", "MAT-GLS-250", "Supplied & Active", "Rigid amber glass packaging jars for secondary containers."),
                new SupplierMaterialHistory(null, 1L, "Yuthma Global Materials", "Steel Strapping Tape 19mm", "Metal & Strapping", 500, "Rolls", 45.00, 22500.00, "Active Inventory", "MAT-STL-19", "Supplied & Active", "Heavy-duty metal strapping tape for pallet bundling."),
                new SupplierMaterialHistory(null, 1L, "PrintCraft Inks Ltd", "UV Matt Protective Coating Varnish", "Chemicals & Varnishes", 300, "Liters", 980.00, 294000.00, "6/20/2026", "MAT-VAR-042", "Supplied & Active", "Water-resistant matte protective varnish coating."),
                new SupplierMaterialHistory(null, 2L, "EcoBoard Packaging Supplies", "Bleached White Kraft Board 280 GSM", "Cardboard & Paperboard", 7500, "Sheets", 210.00, 1575000.00, "7/18/2026", "MAT-WHT-280", "Supplied & Active", "Premium white paperboard for folding cartons."),
                new SupplierMaterialHistory(null, 3L, "PackTech Adhesives Corp", "Hot Melt Side Sealing Glue Sticks", "Tapes & Adhesives", 800, "Kg", 450.00, 360000.00, "7/30/2026", "MAT-HGL-055", "Supplied & Active", "Fast-setting hot melt side sealing sticks for rigid box flaps."),
                new SupplierMaterialHistory(null, 4L, "Apex Polymer Films Co", "BOPP Gloss Lamination Film Roll (12 Micron)", "Plastics & Films", 50, "Rolls", 8500.00, 425000.00, "7/2/2026", "MAT-FLM-302", "Supplied & Active", "Ultra-clear gloss lamination film for glossy finish."),
                new SupplierMaterialHistory(null, 4L, "Apex Polymer Films Co", "Polypropylene Stretch Film 20 Micron", "Plastics & Films", 120, "Rolls", 3200.00, 384000.00, "8/10/2026", "MAT-STR-020", "Supplied & Active", "Pallet wrapping stretch film rolls."),
                new SupplierMaterialHistory(null, 3L, "PackTech Adhesives Corp", "Double-Sided Foam Mounting Tape 24mm", "Tapes & Adhesives", 600, "Rolls", 180.00, 108000.00, "8/25/2026", "MAT-TAP-024", "Supplied & Active", "High adhesion foam mounting tape.")
            );
            supplierMaterialHistoryRepository.saveAll(historyList);
            System.out.println("✓ Migrated " + historyList.size() + " records into table 'material_history'");
        } else {
            System.out.println("• Table 'material_history' already populated (" + supplierMaterialHistoryRepository.count() + " rows)");
        }
    }

    private void seedPackagingTasks() {
        if (packagingTaskRepository.count() == 0) {
            List<PackagingTask> fileTasks = filePackagingTaskRepository.findAllFromFile();
            if (fileTasks != null && !fileTasks.isEmpty()) {
                packagingTaskRepository.saveAll(fileTasks);
                System.out.println("✓ Migrated " + fileTasks.size() + " records into table 'packaing_tasks'");
            } else {
                List<PackagingOrder> orders = fileOrderRepository.findAll();
                List<PackagingTask> initialTasks = new java.util.ArrayList<>();
                for (PackagingOrder o : orders) {
                    if (o.getId() == null) continue;
                    String leader = o.getTeamLeader();
                    String instructions = o.getPmInstructions();
                    String now = o.getCreatedAt() != null ? o.getCreatedAt() : "2026-10-10T08:00:00";
                    boolean added = false;
                    if (o.getAssignedTasksJson() != null && !o.getAssignedTasksJson().trim().isEmpty()) {
                        try {
                            List<Map<String, String>> parsed = objectMapper.readValue(o.getAssignedTasksJson(), new TypeReference<List<Map<String, String>>>() {});
                            for (Map<String, String> item : parsed) {
                                String member = item.getOrDefault("member", item.get("name"));
                                String task = item.get("task");
                                if (member != null && !member.trim().isEmpty()) {
                                    initialTasks.add(new PackagingTask(null, o.getId(), o.getOrderNumber(), o.getPackagingType(), leader, member, task != null ? task : "Assigned packaging task", instructions, "Assigned", "Packaging Manager", now));
                                    added = true;
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                    if (!added && o.getTeamMembers() != null && !o.getTeamMembers().trim().isEmpty()) {
                        String[] members = o.getTeamMembers().split(",");
                        String[] tasks = { o.getMember1Task(), o.getMember2Task(), o.getMember3Task(), o.getMember4Task() };
                        for (int i = 0; i < members.length; i++) {
                            String m = members[i].trim();
                            if (!m.isEmpty()) {
                                String t = (i < tasks.length && tasks[i] != null && !tasks[i].trim().isEmpty()) ? tasks[i] : "General packaging duty";
                                initialTasks.add(new PackagingTask(null, o.getId(), o.getOrderNumber(), o.getPackagingType(), leader, m, t, instructions, "Assigned", "Packaging Manager", now));
                            }
                        }
                    }
                }
                if (!initialTasks.isEmpty()) {
                    packagingTaskRepository.saveAll(initialTasks);
                    filePackagingTaskRepository.saveAll(initialTasks);
                    System.out.println("✓ Generated & seeded " + initialTasks.size() + " records into table 'packaing_tasks'");
                }
            }
        } else {
            System.out.println("• Table 'packaing_tasks' already populated (" + packagingTaskRepository.count() + " rows)");
        }
    }
}
