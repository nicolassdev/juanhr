/*
 Navicat Premium Data Transfer

 Source Server         : database
 Source Server Type    : MySQL
 Source Server Version : 100432 (10.4.32-MariaDB)
 Source Host           : localhost:3306
 Source Schema         : juanhr_v3

 Target Server Type    : MySQL
 Target Server Version : 100432 (10.4.32-MariaDB)
 File Encoding         : 65001

 Date: 21/06/2026 11:49:30
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for _prisma_migrations
-- ----------------------------
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE `_prisma_migrations`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) NULL DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `rolled_back_at` datetime(3) NULL DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of _prisma_migrations
-- ----------------------------
INSERT INTO `_prisma_migrations` VALUES ('13795781-ac44-45f2-9978-42783b29536e', 'edb965b8ca0137cd573a40e5cd5a5652213b5a7f73d568d5e53bd03eeee2ef46', '2026-03-24 11:10:34.694', '20260324111034_add_late_rule', NULL, NULL, '2026-03-24 11:10:34.688', 1);
INSERT INTO `_prisma_migrations` VALUES ('6a308608-9125-4a0d-92d6-43c6c1858ab7', '0c521cb5018481981fa00dee4102260a38ef693159773ab93c3548c2255c2553', '2026-03-24 11:10:33.445', '20260321225444_init', NULL, NULL, '2026-03-24 11:10:32.933', 1);

-- ----------------------------
-- Table structure for audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `action` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int NULL DEFAULT NULL,
  `target_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `old_values` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `new_values` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `ip_address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `audit_logs_user_id_idx`(`user_id` ASC) USING BTREE,
  INDEX `audit_logs_action_idx`(`action` ASC) USING BTREE,
  INDEX `audit_logs_created_at_idx`(`created_at` ASC) USING BTREE,
  CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 61 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of audit_logs
-- ----------------------------
INSERT INTO `audit_logs` VALUES (1, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 11:28:54.563');
INSERT INTO `audit_logs` VALUES (2, 1, 'UPDATE_SCHEDULE', 'schedules', 1, NULL, NULL, NULL, NULL, NULL, '2026-03-24 11:29:40.810');
INSERT INTO `audit_logs` VALUES (3, 2, 'REGISTER', 'auth', 2, 'user', NULL, NULL, NULL, NULL, '2026-03-24 11:51:39.337');
INSERT INTO `audit_logs` VALUES (4, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 11:51:59.482');
INSERT INTO `audit_logs` VALUES (5, 2, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 11:55:01.291');
INSERT INTO `audit_logs` VALUES (6, 3, 'REGISTER', 'auth', 3, 'user', NULL, NULL, NULL, NULL, '2026-03-24 11:55:36.676');
INSERT INTO `audit_logs` VALUES (7, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 11:56:26.346');
INSERT INTO `audit_logs` VALUES (8, 1, 'CHANGE_ROLE', 'users', 3, 'user', NULL, '{\"roleId\":2}', NULL, NULL, '2026-03-24 11:57:16.632');
INSERT INTO `audit_logs` VALUES (9, 1, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 11:59:01.055');
INSERT INTO `audit_logs` VALUES (10, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 11:59:08.011');
INSERT INTO `audit_logs` VALUES (11, 1, 'CREATE_SCHEDULE', 'schedules', 2, NULL, NULL, NULL, NULL, NULL, '2026-03-24 12:00:05.543');
INSERT INTO `audit_logs` VALUES (12, 1, 'ASSIGN_SUPERVISOR', 'assignments', 2, NULL, NULL, NULL, NULL, NULL, '2026-03-24 12:00:18.856');
INSERT INTO `audit_logs` VALUES (13, 1, 'ASSIGN_SCHEDULE', 'schedules', 2, NULL, NULL, '{\"scheduleId\":2,\"scheduleName\":\"1 period \"}', NULL, NULL, '2026-03-24 12:00:18.869');
INSERT INTO `audit_logs` VALUES (14, 1, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 12:00:25.425');
INSERT INTO `audit_logs` VALUES (15, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 12:00:32.169');
INSERT INTO `audit_logs` VALUES (16, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 12:01:48.193');
INSERT INTO `audit_logs` VALUES (17, 1, 'UPDATE_SCHEDULE', 'schedules', 2, NULL, NULL, NULL, NULL, NULL, '2026-03-24 12:02:11.802');
INSERT INTO `audit_logs` VALUES (18, 2, 'DTR_AM_IN', 'dtr', 1, 'dtr', NULL, NULL, NULL, NULL, '2026-03-24 12:06:54.629');
INSERT INTO `audit_logs` VALUES (19, 1, 'UPDATE_SCHEDULE', 'schedules', 2, NULL, NULL, NULL, NULL, NULL, '2026-03-24 12:07:18.741');
INSERT INTO `audit_logs` VALUES (20, 2, 'DTR_AM_IN', 'dtr', 2, 'dtr', NULL, NULL, NULL, NULL, '2026-03-24 12:07:52.724');
INSERT INTO `audit_logs` VALUES (21, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 12:38:18.705');
INSERT INTO `audit_logs` VALUES (22, 2, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 12:47:19.245');
INSERT INTO `audit_logs` VALUES (23, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 12:47:25.172');
INSERT INTO `audit_logs` VALUES (24, 2, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 12:48:08.413');
INSERT INTO `audit_logs` VALUES (25, 3, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 12:48:22.002');
INSERT INTO `audit_logs` VALUES (26, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 14:25:43.730');
INSERT INTO `audit_logs` VALUES (27, 1, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 14:29:07.217');
INSERT INTO `audit_logs` VALUES (28, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 14:29:21.454');
INSERT INTO `audit_logs` VALUES (29, 2, 'DTR_AM_OUT', 'dtr', 2, 'dtr', NULL, NULL, NULL, NULL, '2026-03-24 14:29:32.109');
INSERT INTO `audit_logs` VALUES (30, 2, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 14:30:03.446');
INSERT INTO `audit_logs` VALUES (31, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 14:53:57.546');
INSERT INTO `audit_logs` VALUES (32, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 15:40:17.758');
INSERT INTO `audit_logs` VALUES (33, 1, 'CHANGE_ROLE', 'users', 2, 'user', NULL, '{\"roleId\":1}', NULL, NULL, '2026-03-24 15:40:27.692');
INSERT INTO `audit_logs` VALUES (34, 1, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 15:40:39.904');
INSERT INTO `audit_logs` VALUES (35, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 15:40:55.402');
INSERT INTO `audit_logs` VALUES (36, 2, 'CHANGE_ROLE', 'users', 2, 'user', NULL, '{\"roleId\":3}', NULL, NULL, '2026-03-24 15:41:21.038');
INSERT INTO `audit_logs` VALUES (37, 2, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 15:41:35.415');
INSERT INTO `audit_logs` VALUES (38, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 15:41:42.294');
INSERT INTO `audit_logs` VALUES (39, 2, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 15:42:48.243');
INSERT INTO `audit_logs` VALUES (40, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 15:43:03.224');
INSERT INTO `audit_logs` VALUES (41, 1, 'ASSIGN_SUPERVISOR', 'assignments', 2, NULL, NULL, NULL, NULL, NULL, '2026-03-24 15:43:49.945');
INSERT INTO `audit_logs` VALUES (42, 1, 'ASSIGN_SCHEDULE', 'schedules', 2, NULL, NULL, '{\"scheduleId\":1,\"scheduleName\":\"Standard 8-5\"}', NULL, NULL, '2026-03-24 15:43:49.960');
INSERT INTO `audit_logs` VALUES (43, 1, 'ASSIGN_SCHEDULE', 'schedules', 2, NULL, NULL, '{\"scheduleId\":2,\"scheduleName\":\"1 period \"}', NULL, NULL, '2026-03-24 15:44:44.058');
INSERT INTO `audit_logs` VALUES (44, 1, 'ASSIGN_SUPERVISOR', 'assignments', 2, NULL, NULL, NULL, NULL, NULL, '2026-03-24 15:45:35.434');
INSERT INTO `audit_logs` VALUES (45, 1, 'ASSIGN_SCHEDULE', 'schedules', 2, NULL, NULL, '{\"scheduleId\":1,\"scheduleName\":\"Standard 8-5\"}', NULL, NULL, '2026-03-24 15:45:35.570');
INSERT INTO `audit_logs` VALUES (46, 1, 'ASSIGN_SUPERVISOR', 'assignments', 2, NULL, NULL, NULL, NULL, NULL, '2026-03-24 15:46:26.365');
INSERT INTO `audit_logs` VALUES (47, 1, 'ASSIGN_SCHEDULE', 'schedules', 2, NULL, NULL, '{\"scheduleId\":2,\"scheduleName\":\"1 period \"}', NULL, NULL, '2026-03-24 15:46:26.396');
INSERT INTO `audit_logs` VALUES (48, 1, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 15:47:11.386');
INSERT INTO `audit_logs` VALUES (49, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 15:47:18.754');
INSERT INTO `audit_logs` VALUES (50, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 15:52:31.678');
INSERT INTO `audit_logs` VALUES (51, 1, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 15:58:44.292');
INSERT INTO `audit_logs` VALUES (52, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 15:58:52.971');
INSERT INTO `audit_logs` VALUES (53, 2, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 16:04:38.484');
INSERT INTO `audit_logs` VALUES (54, 3, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-24 16:04:51.048');
INSERT INTO `audit_logs` VALUES (55, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-25 14:13:02.811');
INSERT INTO `audit_logs` VALUES (56, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-25 14:34:15.293');
INSERT INTO `audit_logs` VALUES (57, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-26 13:48:40.273');
INSERT INTO `audit_logs` VALUES (58, 1, 'LOGOUT', 'auth', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-26 13:49:37.937');
INSERT INTO `audit_logs` VALUES (59, 2, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-03-26 13:49:47.171');
INSERT INTO `audit_logs` VALUES (60, 1, 'LOGIN', 'auth', NULL, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', '2026-06-21 03:43:09.296');

-- ----------------------------
-- Table structure for departments
-- ----------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `deleted_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of departments
-- ----------------------------
INSERT INTO `departments` VALUES (1, 'General', 'Default department', NULL, '2026-03-24 11:10:37.053', '2026-03-24 11:10:37.053');

-- ----------------------------
-- Table structure for dtr
-- ----------------------------
DROP TABLE IF EXISTS `dtr`;
CREATE TABLE `dtr`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `schedule_id` int NULL DEFAULT NULL,
  `date` date NOT NULL,
  `am_in` datetime(3) NULL DEFAULT NULL,
  `am_in_selfie` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `am_out` datetime(3) NULL DEFAULT NULL,
  `am_out_selfie` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `pm_in` datetime(3) NULL DEFAULT NULL,
  `pm_in_selfie` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `pm_out` datetime(3) NULL DEFAULT NULL,
  `pm_out_selfie` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `total_minutes` int NULL DEFAULT NULL,
  `status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'present',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `dtr_user_id_date_key`(`user_id` ASC, `date` ASC) USING BTREE,
  INDEX `dtr_user_id_date_idx`(`user_id` ASC, `date` ASC) USING BTREE,
  INDEX `dtr_date_idx`(`date` ASC) USING BTREE,
  INDEX `dtr_schedule_id_fkey`(`schedule_id` ASC) USING BTREE,
  CONSTRAINT `dtr_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `dtr_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of dtr
-- ----------------------------
INSERT INTO `dtr` VALUES (2, 2, 2, '2026-03-24', '2026-03-24 12:07:52.709', '/uploads/selfies/1774354072708-jmq6xiu6vco.jpg', '2026-03-24 14:29:32.093', '/uploads/selfies/1774362572091-wrrof4mv10d.jpg', NULL, NULL, NULL, NULL, 141, 'present', NULL, '2026-03-24 12:07:52.714', '2026-03-24 14:29:32.099');

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `notifications_user_id_is_read_idx`(`user_id` ASC, `is_read` ASC) USING BTREE,
  CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------
INSERT INTO `notifications` VALUES (1, 2, 'SUPERVISOR_ASSIGNED', 'Supervisor Assigned', 'A supervisor has been assigned to you.', NULL, 1, '2026-03-24 12:02:29.706', '2026-03-24 12:00:18.858');
INSERT INTO `notifications` VALUES (2, 3, 'DTR_IN', 'Nicolas Daen clocked in', '⚠️ Late at 08:06 PM', NULL, 0, NULL, '2026-03-24 12:06:54.632');
INSERT INTO `notifications` VALUES (3, 3, 'DTR_IN', 'Nicolas Daen clocked in', '✅ On time at 08:07 PM', NULL, 0, NULL, '2026-03-24 12:07:52.726');
INSERT INTO `notifications` VALUES (4, 3, 'DTR_OUT', 'Nicolas Daen clocked out', '✅ Day complete at 10:29 PM — 2h 21m rendered', NULL, 0, NULL, '2026-03-24 14:29:32.114');
INSERT INTO `notifications` VALUES (5, 2, 'SUPERVISOR_ASSIGNED', 'Supervisor Assigned', 'A supervisor has been assigned to you.', NULL, 1, '2026-03-24 15:47:50.794', '2026-03-24 15:43:49.947');
INSERT INTO `notifications` VALUES (6, 2, 'SUPERVISOR_ASSIGNED', 'Supervisor Assigned', 'A supervisor has been assigned to you.', NULL, 1, '2026-03-24 15:47:50.794', '2026-03-24 15:45:35.469');
INSERT INTO `notifications` VALUES (7, 2, 'SUPERVISOR_ASSIGNED', 'Supervisor Assigned', 'A supervisor has been assigned to you.', NULL, 1, '2026-03-24 15:47:50.794', '2026-03-24 15:46:26.375');

-- ----------------------------
-- Table structure for ojt_schedules
-- ----------------------------
DROP TABLE IF EXISTS `ojt_schedules`;
CREATE TABLE `ojt_schedules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `ojt_id` int NOT NULL,
  `schedule_id` int NOT NULL,
  `assigned_by` int NULL DEFAULT NULL,
  `effective_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `ojt_schedules_ojt_id_key`(`ojt_id` ASC) USING BTREE,
  INDEX `ojt_schedules_schedule_id_fkey`(`schedule_id` ASC) USING BTREE,
  CONSTRAINT `ojt_schedules_ojt_id_fkey` FOREIGN KEY (`ojt_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ojt_schedules_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ojt_schedules
-- ----------------------------
INSERT INTO `ojt_schedules` VALUES (1, 2, 2, 1, '2026-03-24 15:46:26.392');

-- ----------------------------
-- Table structure for permissions
-- ----------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `permissions_key_key`(`key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of permissions
-- ----------------------------
INSERT INTO `permissions` VALUES (1, 'users.view', 'View Users', 'users');
INSERT INTO `permissions` VALUES (2, 'users.create', 'Create Users', 'users');
INSERT INTO `permissions` VALUES (3, 'users.update', 'Update Users', 'users');
INSERT INTO `permissions` VALUES (4, 'users.delete', 'Delete Users', 'users');
INSERT INTO `permissions` VALUES (5, 'dtr.view', 'View DTR', 'dtr');
INSERT INTO `permissions` VALUES (6, 'dtr.export', 'Export DTR', 'dtr');
INSERT INTO `permissions` VALUES (7, 'dtr.manage', 'Manage DTR Records', 'dtr');
INSERT INTO `permissions` VALUES (8, 'schedules.manage', 'Manage Schedules', 'schedules');
INSERT INTO `permissions` VALUES (9, 'reports.view', 'View Reports', 'reports');
INSERT INTO `permissions` VALUES (10, 'audit.view', 'View Audit Logs', 'audit');

-- ----------------------------
-- Table structure for refresh_tokens
-- ----------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `refresh_tokens_user_id_fkey`(`user_id` ASC) USING BTREE,
  CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of refresh_tokens
-- ----------------------------
INSERT INTO `refresh_tokens` VALUES (1, 1, 'bf8c63e3bf23d41695b531ed686c4848d3825b76285cac2a85abcb01103d2aac', '2026-03-31 11:28:54.543', 1, '2026-03-24 11:28:54.553');
INSERT INTO `refresh_tokens` VALUES (2, 2, '86a49fcda06688f4e4391596dd9bff85e04d358c30a573a1ff80483c8d7cde66', '2026-03-31 11:51:59.397', 1, '2026-03-24 11:51:59.398');
INSERT INTO `refresh_tokens` VALUES (3, 1, '08306caa5222c10a963f895d4fb8cd943872f5a5fc837a46b24837b25b8a7721', '2026-03-31 11:56:26.332', 1, '2026-03-24 11:56:26.333');
INSERT INTO `refresh_tokens` VALUES (4, 1, '8c5393a3295f75affcd0ba50c5d2fea80c47fd9237f1c6c56bcd8f6227f5c375', '2026-03-31 11:59:07.996', 1, '2026-03-24 11:59:07.998');
INSERT INTO `refresh_tokens` VALUES (5, 2, '8280af8b09dbb6750a02d7ed412d51082d8a8c0d44da5061091c40ac2f86776e', '2026-03-31 12:00:32.156', 1, '2026-03-24 12:00:32.157');
INSERT INTO `refresh_tokens` VALUES (6, 1, '410ab6bcf9c2173933a7ba2b714afe45080aef9e262ff91124e2dc1d49df2fd8', '2026-03-31 12:01:48.180', 1, '2026-03-24 12:01:48.182');
INSERT INTO `refresh_tokens` VALUES (7, 2, '675f610dc82d090ef538475cc9dc161e307535cafbabd3b530c5b6a9cb3d1c53', '2026-03-31 12:38:18.698', 1, '2026-03-24 12:38:18.699');
INSERT INTO `refresh_tokens` VALUES (8, 2, '6c48446ec13dc573b005c09ea5827e6200f647a47223548ad3bf7ebb5a0e154c', '2026-03-31 12:47:25.164', 1, '2026-03-24 12:47:25.166');
INSERT INTO `refresh_tokens` VALUES (9, 3, '653f5cf9f28740f583eec18b19625265fb988ff0a6457340fdc31de8c2f4053f', '2026-03-31 12:48:21.988', 0, '2026-03-24 12:48:21.989');
INSERT INTO `refresh_tokens` VALUES (10, 1, 'b0023bcbaa908bee1f5073438056bcc420f38d116d8edafdc2411893a2a91000', '2026-03-31 14:25:43.723', 1, '2026-03-24 14:25:43.725');
INSERT INTO `refresh_tokens` VALUES (11, 2, 'a1681decae2ad941d146a83c4b5df123d723ed8eef35ae6fdba6eaa976ed0a27', '2026-03-31 14:29:21.438', 1, '2026-03-24 14:29:21.440');
INSERT INTO `refresh_tokens` VALUES (12, 1, '670f93ca7dd2ffc29710369c60fc857b184dd8fd1aa4c8908d4352870b49227b', '2026-03-31 14:53:57.532', 1, '2026-03-24 14:53:57.534');
INSERT INTO `refresh_tokens` VALUES (13, 1, '994dc8b3a4bf5aa9e6b461a2cec6fb7b9e7ec649e14574102d9ccda5b8960667', '2026-03-31 15:40:17.742', 1, '2026-03-24 15:40:17.744');
INSERT INTO `refresh_tokens` VALUES (14, 2, '910b7507ab66cd23a14c31739a7cb8ec7c5607ed2c9b2f9e250378a0853579a0', '2026-03-31 15:40:55.386', 1, '2026-03-24 15:40:55.388');
INSERT INTO `refresh_tokens` VALUES (15, 2, 'e4f938c4e333752df0f3cc3f6f8de40bb0a5a9858f69d8b812fff92aab97ed35', '2026-03-31 15:41:42.280', 1, '2026-03-24 15:41:42.282');
INSERT INTO `refresh_tokens` VALUES (16, 1, 'f66b343eec33ca5897efcff25c0c1ecd575e6c4855b7890276357207ddcca8c2', '2026-03-31 15:43:03.210', 1, '2026-03-24 15:43:03.210');
INSERT INTO `refresh_tokens` VALUES (17, 2, '7f9970d91c0d2093abd0191f2c66c870f77e851a5d1c0d7845284e9544fbc939', '2026-03-31 15:47:18.748', 1, '2026-03-24 15:47:18.750');
INSERT INTO `refresh_tokens` VALUES (18, 1, '2db5c0f6181dffa36040fd80afb5e51af40662149b2d596153435948bf5c742b', '2026-03-31 15:52:31.660', 1, '2026-03-24 15:52:31.662');
INSERT INTO `refresh_tokens` VALUES (19, 2, '287a5ae71d0a938cd08fe889627989e85c03f423e4bac2fb2ef24c9cd339992c', '2026-03-31 15:58:52.958', 1, '2026-03-24 15:58:52.960');
INSERT INTO `refresh_tokens` VALUES (20, 3, '9ab3cc294911260227d55d91ada199548f471851849e7911cf8cffdc50086df6', '2026-03-31 16:04:51.042', 0, '2026-03-24 16:04:51.043');
INSERT INTO `refresh_tokens` VALUES (21, 1, '8231b06705c6de3516de1f8123f12d342a32d49f47f62a8dff58e827be7415e4', '2026-04-01 14:13:02.786', 1, '2026-03-25 14:13:02.791');
INSERT INTO `refresh_tokens` VALUES (22, 2, '1d9c965984398156867b29c01d0cc89ae3094965564443853a1ac346bbf39c8f', '2026-04-01 14:34:15.280', 0, '2026-03-25 14:34:15.281');
INSERT INTO `refresh_tokens` VALUES (23, 1, '311c9aec520288bbaf9cef8c1b6a18faefd0f22fe0e557b97f2becfca6cc4e6d', '2026-04-02 13:48:40.253', 1, '2026-03-26 13:48:40.254');
INSERT INTO `refresh_tokens` VALUES (24, 2, '910f738c4aae828eb11fa47934a8ec59d69185b7d0810484f948352b9a8fabe8', '2026-04-02 13:49:47.158', 0, '2026-03-26 13:49:47.159');
INSERT INTO `refresh_tokens` VALUES (25, 1, 'a74d13fe3edc481812305d6a96338925cfe01ea128bd0c13480bcb9db91adafc', '2026-06-28 03:43:09.280', 0, '2026-06-21 03:43:09.282');

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `roles_name_key`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of roles
-- ----------------------------
INSERT INTO `roles` VALUES (1, 'admin', 'Administrator', '2026-03-24 11:10:37.013');
INSERT INTO `roles` VALUES (2, 'supervisor', 'Supervisor', '2026-03-24 11:10:37.032');
INSERT INTO `roles` VALUES (3, 'ojt', 'OJT Employee', '2026-03-24 11:10:37.034');

-- ----------------------------
-- Table structure for schedules
-- ----------------------------
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'one_period',
  `am_in` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `am_out` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pm_in` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `pm_out` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `work_days` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `grace_minutes` int NOT NULL DEFAULT 15,
  `created_by` int NULL DEFAULT NULL,
  `deleted_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `late_rule` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `schedules_created_by_fkey`(`created_by` ASC) USING BTREE,
  CONSTRAINT `schedules_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of schedules
-- ----------------------------
INSERT INTO `schedules` VALUES (1, 'Standard 8-5', 'two_period', '08:00', '12:00', '13:00', '17:00', '[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\",\"Sun\"]', 15, NULL, NULL, '2026-03-24 11:10:37.270', '08:10');
INSERT INTO `schedules` VALUES (2, '1 period ', 'one_period', '20:04', '00:00', '13:00', '17:00', '[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\"]', 15, 1, NULL, '2026-03-24 12:00:05.532', '');

-- ----------------------------
-- Table structure for supervisor_assignments
-- ----------------------------
DROP TABLE IF EXISTS `supervisor_assignments`;
CREATE TABLE `supervisor_assignments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `supervisor_id` int NOT NULL,
  `ojt_id` int NOT NULL,
  `assigned_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `assigned_by` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `supervisor_assignments_ojt_id_key`(`ojt_id` ASC) USING BTREE,
  INDEX `supervisor_assignments_supervisor_id_idx`(`supervisor_id` ASC) USING BTREE,
  CONSTRAINT `supervisor_assignments_ojt_id_fkey` FOREIGN KEY (`ojt_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `supervisor_assignments_supervisor_id_fkey` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of supervisor_assignments
-- ----------------------------
INSERT INTO `supervisor_assignments` VALUES (1, 3, 2, '2026-03-24 12:00:18.847', 1);

-- ----------------------------
-- Table structure for user_permissions
-- ----------------------------
DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions`  (
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT 1,
  `granted_by` int NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`user_id`, `permission_id`) USING BTREE,
  INDEX `user_permissions_permission_id_fkey`(`permission_id` ASC) USING BTREE,
  CONSTRAINT `user_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_permissions
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `department_id` int NULL DEFAULT NULL,
  `full_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `school` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `course` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `profile_image` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `last_login_at` datetime(3) NULL DEFAULT NULL,
  `deleted_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `users_email_key`(`email` ASC) USING BTREE,
  INDEX `users_email_idx`(`email` ASC) USING BTREE,
  INDEX `users_role_id_idx`(`role_id` ASC) USING BTREE,
  INDEX `users_department_id_fkey`(`department_id` ASC) USING BTREE,
  CONSTRAINT `users_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 1, 1, 'System Administrator', 'admin@juanhr.com', '$2b$12$u/i7200d/P7uPrIghsI6d.IjwKSMUqlEFDcazkycPHGndnrK8KIn.', 'male', NULL, NULL, NULL, 1, 0, '2026-06-21 03:43:09.291', NULL, '2026-03-24 11:10:37.266', '2026-06-21 03:43:09.292');
INSERT INTO `users` VALUES (2, 3, NULL, 'Nicolas Daen', 'nicolasdaen10@gmail.com', '$2b$12$1/QhgAOwYwriYjPYd.BnWOD7TsxylnSWF9n6P0RsgeUa3C4/s4mZi', 'male', 'Computer  System Institute', 'BS Computer Science', '/uploads/avatars/1774353129720.png', 1, 0, '2026-03-26 13:49:47.167', NULL, '2026-03-24 11:51:39.335', '2026-03-26 13:49:47.168');
INSERT INTO `users` VALUES (3, 2, NULL, 'James Yap', 'yap@gmail.com', '$2b$12$BlqvNfWsw3pfAiT1kasM.und0IGHIzm3rMEcPbz1c5xA1CWBynEkC', 'male', '', '', NULL, 1, 0, '2026-03-24 16:04:51.045', NULL, '2026-03-24 11:55:36.593', '2026-03-24 16:04:51.046');

SET FOREIGN_KEY_CHECKS = 1;
