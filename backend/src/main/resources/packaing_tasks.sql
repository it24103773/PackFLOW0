-- ====================================================================
-- Table Schema for Assign Plant Staff & Production Tasks
-- Table Name: packaing_tasks
-- Database: packflow_db
-- ====================================================================

CREATE TABLE IF NOT EXISTS packaing_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    order_number VARCHAR(255),
    packaging_type VARCHAR(255),
    team_leader VARCHAR(255),
    staff_member VARCHAR(255),
    task_description TEXT,
    pm_instructions TEXT,
    status VARCHAR(50) DEFAULT 'Assigned',
    assigned_by VARCHAR(255),
    created_at VARCHAR(255)
);

-- Indexing for fast query lookups
CREATE INDEX idx_packaing_tasks_order_id ON packaing_tasks (order_id);
CREATE INDEX idx_packaing_tasks_order_number ON packaing_tasks (order_number);
CREATE INDEX idx_packaing_tasks_staff_member ON packaing_tasks (staff_member);
