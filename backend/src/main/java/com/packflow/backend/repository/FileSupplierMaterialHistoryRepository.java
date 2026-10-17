package com.packflow.backend.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.packflow.backend.model.SupplierMaterialHistory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.stream.Collectors;

@Repository
public class FileSupplierMaterialHistoryRepository {

    private final String filePath = "storage/material_history.json";
    private final ObjectMapper objectMapper;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final JpaSupplierMaterialHistoryRepository jpaRepository;

    public FileSupplierMaterialHistoryRepository(@Lazy JpaSupplierMaterialHistoryRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        ensureFileExists();
    }

    private void ensureFileExists() {
        lock.writeLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                if (file.getParentFile() != null) {
                    file.getParentFile().mkdirs();
                }
                file.createNewFile();
                objectMapper.writeValue(file, createSeedHistory());
            }
        } catch (IOException e) {
            System.err.println("Error initializing storage/material_history.json: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<SupplierMaterialHistory> createSeedHistory() {
        List<SupplierMaterialHistory> historyList = new ArrayList<>();
        historyList.add(new SupplierMaterialHistory(1L, 1L, "Yuthma Global Materials", "Kraft Paperboard Rolls (300 GSM)", "Cardboard & Paperboard", 5000, "Kg", 45.00, 225000.00, "Active Inventory", "MAT-KFT-300", "Supplied & Active", "High opacity 300 GSM kraft rolls for corrugated box production."));
        historyList.add(new SupplierMaterialHistory(2L, 2L, "EcoBoard Packaging Supplies", "Corrugated Flute B Sheets", "Cardboard & Paperboard", 1000, "Sheets", 45.00, 45000.00, "Active Inventory", "MAT-FLT-B", "Supplied & Active", "Double-wall B-flute corrugated sheets for shipping boxes."));
        historyList.add(new SupplierMaterialHistory(3L, 4L, "Apex Polymer Films Co", "High-Density Polyethylene Film", "Plastics & Films", 1800, "Meters", 45.00, 81000.00, "9/16/2026", "MAT-HDPE-18", "Supplied & Active", "HDPE protective lamination film for outer packaging."));
        historyList.add(new SupplierMaterialHistory(4L, 1L, "Yuthma Global Materials", "Heavy Duty Bubble Wrap Roll 100m", "Bubble Wrap & Cushioning", 100, "Rolls", 45.00, 4500.00, "Active Inventory", "MAT-BBL-100", "Supplied & Active", "Shock-absorbing cushioning rolls for fragile item packaging."));
        historyList.add(new SupplierMaterialHistory(5L, 3L, "PackTech Adhesives Corp", "Industrial PVA Packaging Adhesive", "Tapes & Adhesives", 5200, "Liters", 45.00, 234000.00, "10/5/2026", "MAT-PVA-52", "Supplied & Active", "High-tack automatic folder-gluer industrial adhesive."));
        historyList.add(new SupplierMaterialHistory(6L, 1L, "PrintCraft Inks Ltd", "Cyan Water-Based Flexo Ink", "Labels & Inks", 500, "Liters", 45.00, 22500.00, "9/15/2026", "MAT-INK-CYN", "Supplied & Active", "Water-based cyan flexo printing ink for outer box printing."));
        historyList.add(new SupplierMaterialHistory(7L, 2L, "Lanka Coating Solutions", "Amber Glass Jars 250ml", "Glass & Containers", 500, "Boxes", 45.00, 22500.00, "Active Inventory", "MAT-GLS-250", "Supplied & Active", "Rigid amber glass packaging jars for secondary containers."));
        historyList.add(new SupplierMaterialHistory(8L, 1L, "Yuthma Global Materials", "Steel Strapping Tape 19mm", "Metal & Strapping", 500, "Rolls", 45.00, 22500.00, "Active Inventory", "MAT-STL-19", "Supplied & Active", "Heavy-duty metal strapping tape for pallet bundling."));
        historyList.add(new SupplierMaterialHistory(9L, 1L, "PrintCraft Inks Ltd", "UV Matt Protective Coating Varnish", "Chemicals & Varnishes", 300, "Liters", 980.00, 294000.00, "6/20/2026", "MAT-VAR-042", "Supplied & Active", "Water-resistant matte protective varnish coating."));
        historyList.add(new SupplierMaterialHistory(10L, 2L, "EcoBoard Packaging Supplies", "Bleached White Kraft Board 280 GSM", "Cardboard & Paperboard", 7500, "Sheets", 210.00, 1575000.00, "7/18/2026", "MAT-WHT-280", "Supplied & Active", "Premium white paperboard for folding cartons."));
        historyList.add(new SupplierMaterialHistory(11L, 3L, "PackTech Adhesives Corp", "Hot Melt Side Sealing Glue Sticks", "Tapes & Adhesives", 800, "Kg", 450.00, 360000.00, "7/30/2026", "MAT-HGL-055", "Supplied & Active", "Fast-setting hot melt side sealing sticks for rigid box flaps."));
        historyList.add(new SupplierMaterialHistory(12L, 4L, "Apex Polymer Films Co", "BOPP Gloss Lamination Film Roll (12 Micron)", "Plastics & Films", 50, "Rolls", 8500.00, 425000.00, "7/2/2026", "MAT-FLM-302", "Supplied & Active", "Ultra-clear gloss lamination film for glossy finish."));
        historyList.add(new SupplierMaterialHistory(13L, 4L, "Apex Polymer Films Co", "Polypropylene Stretch Film 20 Micron", "Plastics & Films", 120, "Rolls", 3200.00, 384000.00, "8/10/2026", "MAT-STR-020", "Supplied & Active", "Pallet wrapping stretch film rolls."));
        historyList.add(new SupplierMaterialHistory(14L, 3L, "PackTech Adhesives Corp", "Double-Sided Foam Mounting Tape 24mm", "Tapes & Adhesives", 600, "Rolls", 180.00, 108000.00, "8/25/2026", "MAT-TAP-024", "Supplied & Active", "High adhesion foam mounting tape."));
        return historyList;
    }

    public List<SupplierMaterialHistory> findAllFromFile() {
        lock.readLock().lock();
        try {
            File file = new File(filePath);
            if (!file.exists() || file.length() == 0) {
                return createSeedHistory();
            }
            return objectMapper.readValue(file, new TypeReference<List<SupplierMaterialHistory>>() {});
        } catch (IOException e) {
            return createSeedHistory();
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<SupplierMaterialHistory> findAll() {
        if (jpaRepository != null && jpaRepository.count() > 0) {
            return jpaRepository.findAll();
        }
        return findAllFromFile();
    }

    public List<SupplierMaterialHistory> findBySupplierId(Long supplierId) {
        if (supplierId == null) return findAll();
        if (jpaRepository != null && jpaRepository.count() > 0) {
            return jpaRepository.findBySupplierId(supplierId);
        }
        return findAllFromFile().stream()
                .filter(h -> supplierId.equals(h.getSupplierId()))
                .collect(Collectors.toList());
    }

    public SupplierMaterialHistory save(SupplierMaterialHistory record) {
        SupplierMaterialHistory saved = record;
        if (jpaRepository != null) {
            saved = jpaRepository.save(saved);
        }

        lock.writeLock().lock();
        try {
            List<SupplierMaterialHistory> list = findAllFromFile();
            boolean updated = false;
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId() != null && list.get(i).getId().equals(saved.getId())) {
                    list.set(i, saved);
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                if (saved.getId() == null) {
                    long maxId = list.stream().mapToLong(h -> h.getId() != null ? h.getId() : 0L).max().orElse(0L);
                    saved.setId(maxId + 1);
                }
                list.add(saved);
            }
            objectMapper.writeValue(new File(filePath), list);
        } catch (IOException e) {
            System.err.println("Failed to save material history to file backup: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
        return saved;
    }

    public boolean deleteById(Long id) {
        if (id == null) return false;
        if (jpaRepository != null && jpaRepository.existsById(id)) {
            jpaRepository.deleteById(id);
        }
        lock.writeLock().lock();
        try {
            List<SupplierMaterialHistory> list = findAllFromFile();
            boolean removed = list.removeIf(h -> id.equals(h.getId()));
            if (removed) {
                objectMapper.writeValue(new File(filePath), list);
            }
            return removed || (jpaRepository != null);
        } catch (IOException e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
