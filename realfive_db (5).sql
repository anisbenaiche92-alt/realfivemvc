-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : lun. 02 fév. 2026 à 16:01
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `realfive_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` int(11) NOT NULL,
  `company_name` varchar(100) DEFAULT 'RealFive',
  `city` varchar(100) DEFAULT 'Metz',
  `primary_color` varchar(20) DEFAULT '#4DFF99',
  `hero_title` varchar(100) DEFAULT 'DOMINE LE TERRAIN',
  `opening_date` varchar(50) DEFAULT '01 Sept 2025',
  `logo_url` varchar(255) DEFAULT 'image/logo.png',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `app_settings`
--

INSERT INTO `app_settings` (`id`, `company_name`, `city`, `primary_color`, `hero_title`, `opening_date`, `logo_url`, `updated_at`) VALUES
(1, 'RealFive', 'Metz', '#4DFF99', 'DOMINE LE TERRAIN', '01 Sept 2025', 'image/logo.png', '2026-01-12 12:00:44');

-- --------------------------------------------------------

--
-- Structure de la table `championships`
--

CREATE TABLE `championships` (
  `id` int(11) NOT NULL,
  `complex_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('OPEN','ONGOING','FINISHED') DEFAULT 'OPEN',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `complexes`
--

CREATE TABLE `complexes` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `zip_code` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `phone_contact` varchar(20) DEFAULT NULL,
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `is_validated` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `cover_image_url` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `gallery` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gallery`)),
  `complexe_image_url` varchar(255) DEFAULT NULL,
  `logocomplexe_url` varchar(255) DEFAULT NULL,
  `gallerycomplexe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gallerycomplexe`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `complexes`
--

INSERT INTO `complexes` (`id`, `owner_id`, `name`, `description`, `address`, `city`, `zip_code`, `latitude`, `longitude`, `phone_contact`, `amenities`, `is_validated`, `created_at`, `cover_image_url`, `logo_url`, `gallery`, `complexe_image_url`, `logocomplexe_url`, `gallerycomplexe`) VALUES
(1, 7, 'Metz Arena Five', NULL, '12 Rue du Stade', 'Metz', NULL, 49.11930000, 6.17570000, NULL, '{\"parking\":true,\"shower\":true,\"wifi\":true,\"snack\":true}', 1, '2026-01-12 11:33:39', 'https://cdn.pixabay.com/photo/2014/10/14/20/24/ball-488701_1280.jpg', NULL, NULL, NULL, NULL, NULL),
(2, 7, 'Mon Complexe', NULL, '12 Rue du Stade', 'Metz', NULL, NULL, NULL, NULL, '{\"parking\":true,\"shower\":true,\"wifi\":true,\"snack\":true}', 0, '2026-01-13 11:50:32', 'https://cdn.pixabay.com/photo/2014/10/14/20/24/ball-488701_1280.jpg', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `friends`
--

CREATE TABLE `friends` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `friend_id` int(11) NOT NULL,
  `status` enum('PENDING','ACCEPTED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `friends`
--

INSERT INTO `friends` (`id`, `user_id`, `friend_id`, `status`, `created_at`) VALUES
(9, 4, 13, 'ACCEPTED', '2026-01-16 15:36:22'),
(10, 13, 4, 'ACCEPTED', '2026-01-16 15:36:22'),
(13, 5, 4, 'ACCEPTED', '2026-01-28 08:52:11'),
(14, 4, 5, 'ACCEPTED', '2026-01-28 08:52:11');

-- --------------------------------------------------------

--
-- Structure de la table `friend_requests`
--

CREATE TABLE `friend_requests` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `status` enum('PENDING','ACCEPTED','DECLINED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `matches`
--

CREATE TABLE `matches` (
  `id` int(11) NOT NULL,
  `match_code` varchar(20) DEFAULT NULL,
  `team_home_id` int(11) DEFAULT NULL,
  `team_away_id` int(11) DEFAULT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `score_home` int(11) DEFAULT 0,
  `score_away` int(11) DEFAULT 0,
  `is_competitive` tinyint(1) DEFAULT 0,
  `status` enum('SCHEDULED','PLAYED','CANCELLED') DEFAULT 'SCHEDULED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `team_name_a` varchar(50) DEFAULT 'DOMICILE',
  `team_name_b` varchar(50) DEFAULT 'EXTÉRIEUR'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `matches`
--

INSERT INTO `matches` (`id`, `match_code`, `team_home_id`, `team_away_id`, `reservation_id`, `score_home`, `score_away`, `is_competitive`, `status`, `created_at`, `team_name_a`, `team_name_b`) VALUES
(3, 'M-2991', NULL, NULL, 17, 0, 0, 0, 'CANCELLED', '2026-01-13 11:03:39', 'DOMICILE', 'EXTÉRIEUR'),
(4, 'M-3947', NULL, NULL, 18, 0, 0, 0, 'CANCELLED', '2026-01-13 11:27:44', 'DOMICILE', 'EXTÉRIEUR'),
(5, 'M-5253', NULL, NULL, 19, 0, 0, 0, 'CANCELLED', '2026-01-13 11:28:15', 'DOMICILE', 'EXTÉRIEUR'),
(6, 'M-7871', NULL, NULL, 20, 0, 0, 0, 'CANCELLED', '2026-01-13 11:31:43', 'DOMICILE', 'EXTÉRIEUR'),
(7, 'M-3155', NULL, NULL, 21, 0, 0, 0, 'CANCELLED', '2026-01-13 11:45:21', 'DOMICILE', 'EXTÉRIEUR'),
(8, 'M-1679', NULL, NULL, 22, 0, 0, 0, 'CANCELLED', '2026-01-13 11:52:55', 'DOMICILE', 'EXTÉRIEUR'),
(9, 'M-1890', NULL, NULL, 23, 0, 0, 0, 'CANCELLED', '2026-01-13 12:05:53', 'DOMICILE', 'EXTÉRIEUR'),
(10, 'M-8687', NULL, NULL, 24, 0, 0, 0, 'CANCELLED', '2026-01-13 12:07:05', 'DOMICILE', 'EXTÉRIEUR'),
(11, 'M-1962', NULL, NULL, 25, 0, 0, 0, 'CANCELLED', '2026-01-13 12:10:38', 'DOMICILE', 'EXTÉRIEUR'),
(12, 'M-3766', NULL, NULL, 26, 0, 0, 0, 'CANCELLED', '2026-01-13 12:10:53', 'DOMICILE', 'EXTÉRIEUR'),
(13, 'M-4863', NULL, NULL, 27, 0, 0, 0, 'CANCELLED', '2026-01-13 12:14:34', 'DOMICILE', 'EXTÉRIEUR'),
(14, 'M-3960', NULL, NULL, 28, 0, 0, 0, 'CANCELLED', '2026-01-13 12:15:16', 'DOMICILE', 'EXTÉRIEUR'),
(15, 'M-5001', NULL, NULL, 29, 0, 0, 0, 'CANCELLED', '2026-01-13 12:17:23', 'DOMICILE', 'EXTÉRIEUR'),
(16, 'M-3803', NULL, NULL, 30, 0, 0, 0, 'CANCELLED', '2026-01-13 12:17:45', 'DOMICILE', 'EXTÉRIEUR'),
(17, 'M-9240', NULL, NULL, 31, 0, 0, 0, 'CANCELLED', '2026-01-13 14:01:35', 'DOMICILE', 'EXTÉRIEUR'),
(18, 'M-9899', NULL, NULL, 32, 0, 0, 0, 'CANCELLED', '2026-01-13 15:10:05', 'DOMICILE', 'EXTÉRIEUR'),
(19, 'M-7227', NULL, NULL, 33, 0, 0, 0, 'CANCELLED', '2026-01-13 15:29:11', 'DOMICILE', 'EXTÉRIEUR'),
(20, 'M-1924', NULL, NULL, 34, 0, 0, 0, 'CANCELLED', '2026-01-13 15:50:17', 'DOMICILE', 'EXTÉRIEUR'),
(21, 'M-3679', NULL, NULL, 35, 0, 0, 0, 'CANCELLED', '2026-01-13 16:38:46', 'DOMICILE', 'EXTÉRIEUR'),
(22, 'M-2333', NULL, NULL, 36, 0, 0, 0, 'CANCELLED', '2026-01-13 16:45:50', 'DOMICILE', 'EXTÉRIEUR'),
(23, 'M-5492', NULL, NULL, 37, 0, 0, 0, 'CANCELLED', '2026-01-15 10:30:14', 'DOMICILE', 'EXTÉRIEUR'),
(24, 'M-2122', NULL, NULL, 38, 0, 0, 0, 'CANCELLED', '2026-01-15 10:35:40', 'DOMICILE', 'EXTÉRIEUR'),
(25, 'M-9911', NULL, NULL, 39, 0, 0, 0, 'CANCELLED', '2026-01-15 10:39:45', 'DOMICILE', 'EXTÉRIEUR'),
(26, 'M-8022', NULL, NULL, 40, 0, 0, 0, 'CANCELLED', '2026-01-15 10:45:17', 'DOMICILE', 'EXTÉRIEUR'),
(27, 'M-8843', NULL, NULL, 41, 0, 0, 0, 'CANCELLED', '2026-01-15 12:54:53', 'DOMICILE', 'EXTÉRIEUR'),
(28, 'M-4670', NULL, NULL, 42, 0, 0, 0, 'CANCELLED', '2026-01-15 12:55:45', 'DOMICILE', 'EXTÉRIEUR'),
(29, 'M-4732', NULL, NULL, 43, 0, 0, 0, 'CANCELLED', '2026-01-15 13:08:49', 'DOMICILE', 'EXTÉRIEUR'),
(30, 'M-9963', NULL, NULL, 44, 0, 0, 0, 'CANCELLED', '2026-01-15 13:09:24', 'DOMICILE', 'EXTÉRIEUR'),
(31, 'M-2766', NULL, NULL, 45, 0, 0, 0, 'CANCELLED', '2026-01-15 16:12:30', 'DOMICILE', 'EXTÉRIEUR'),
(32, 'M-5905', NULL, NULL, 46, 0, 0, 0, 'CANCELLED', '2026-01-15 16:27:30', 'DOMICILE', 'EXTÉRIEUR'),
(33, 'M-5700', NULL, NULL, 47, 0, 0, 0, 'SCHEDULED', '2026-01-15 16:43:10', 'DOMICILE', 'EXTÉRIEUR'),
(34, 'M-1460', NULL, NULL, 48, 0, 0, 0, 'SCHEDULED', '2026-01-15 16:49:35', 'DOMICILE', 'EXTÉRIEUR'),
(35, 'M-8685', NULL, NULL, 49, 0, 0, 0, 'SCHEDULED', '2026-01-15 16:56:51', 'DOMICILE', 'EXTÉRIEUR'),
(36, 'M-4892', NULL, NULL, 50, 0, 0, 0, 'SCHEDULED', '2026-01-15 20:31:27', 'DOMICILE', 'EXTÉRIEUR'),
(37, 'M-4162', NULL, NULL, 51, 0, 0, 0, 'SCHEDULED', '2026-01-15 20:31:46', 'DOMICILE', 'EXTÉRIEUR'),
(38, 'M-3900', NULL, NULL, 52, 0, 0, 0, 'SCHEDULED', '2026-01-15 20:54:54', 'DOMICILE', 'EXTÉRIEUR'),
(39, 'M-2744', NULL, NULL, 53, 0, 0, 0, 'SCHEDULED', '2026-01-15 20:57:21', 'DOMICILE', 'EXTÉRIEUR'),
(40, 'M-7900', NULL, NULL, 54, 0, 0, 0, 'SCHEDULED', '2026-01-15 21:01:53', 'DOMICILE', 'EXTÉRIEUR'),
(41, 'M-3640', NULL, NULL, 55, 0, 0, 0, 'SCHEDULED', '2026-01-15 21:05:31', 'DOMICILE', 'EXTÉRIEUR'),
(42, 'M-4425', NULL, NULL, 56, 0, 0, 0, 'SCHEDULED', '2026-01-15 21:07:24', 'DOMICILE', 'EXTÉRIEUR'),
(43, 'M-2620', NULL, NULL, 57, 0, 0, 0, 'SCHEDULED', '2026-01-15 21:07:44', 'DOMICILE', 'EXTÉRIEUR'),
(44, 'M-9847', NULL, NULL, 58, 0, 0, 0, 'SCHEDULED', '2026-01-15 21:12:00', 'DOMICILE', 'EXTÉRIEUR'),
(45, 'M-6579', NULL, NULL, 59, 0, 0, 0, 'SCHEDULED', '2026-01-15 21:12:17', 'DOMICILE', 'EXTÉRIEUR'),
(46, 'M-2659', NULL, NULL, 60, 0, 0, 0, 'SCHEDULED', '2026-01-15 22:56:19', 'DOMICILE', 'EXTÉRIEUR'),
(47, 'M-3093', NULL, NULL, 61, 0, 0, 0, 'SCHEDULED', '2026-01-15 23:00:54', 'DOMICILE', 'EXTÉRIEUR'),
(48, 'M-9539', NULL, NULL, 62, 0, 0, 0, 'SCHEDULED', '2026-01-15 23:08:24', 'DOMICILE', 'EXTÉRIEUR'),
(49, 'M-2578', NULL, NULL, 63, 0, 0, 0, 'SCHEDULED', '2026-01-16 08:05:31', 'DOMICILE', 'EXTÉRIEUR'),
(50, 'M-4641', NULL, NULL, 64, 0, 0, 0, 'SCHEDULED', '2026-01-16 08:14:47', 'DOMICILE', 'EXTÉRIEUR'),
(51, 'M-3408', NULL, NULL, 65, 0, 0, 0, 'SCHEDULED', '2026-01-16 08:30:47', 'DOMICILE', 'EXTÉRIEUR'),
(53, 'M-8526', NULL, NULL, 67, 0, 0, 0, 'SCHEDULED', '2026-01-16 08:38:51', 'DOMICILE', 'EXTÉRIEUR'),
(54, 'M-3405', NULL, NULL, 68, 0, 0, 0, 'SCHEDULED', '2026-01-16 09:21:40', 'DOMICILE', 'EXTÉRIEUR'),
(55, 'M-8608', NULL, NULL, 69, 0, 0, 0, 'SCHEDULED', '2026-01-16 09:22:13', 'DOMICILE', 'EXTÉRIEUR'),
(56, 'M-9182', NULL, NULL, 70, 0, 0, 0, 'SCHEDULED', '2026-01-16 09:27:09', 'DOMICILE', 'EXTÉRIEUR'),
(57, 'M-9662', NULL, NULL, 71, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:03:39', 'DOMICILE', 'EXTÉRIEUR'),
(58, 'M-8895', NULL, NULL, 72, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:04:11', 'DOMICILE', 'EXTÉRIEUR'),
(59, 'M-8037', NULL, NULL, 73, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:09:58', 'DOMICILE', 'EXTÉRIEUR'),
(60, 'M-8593', NULL, NULL, 74, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:18:47', 'DOMICILE', 'EXTÉRIEUR'),
(61, 'M-1654', NULL, NULL, 75, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:19:25', 'DOMICILE', 'EXTÉRIEUR'),
(62, 'M-4917', NULL, NULL, 76, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:20:34', 'DOMICILE', 'EXTÉRIEUR'),
(63, 'M-8209', NULL, NULL, 77, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:21:53', 'DOMICILE', 'EXTÉRIEUR'),
(64, 'M-3345', NULL, NULL, 78, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:32:52', 'DOMICILE', 'EXTÉRIEUR'),
(65, 'M-4009', NULL, NULL, 79, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:33:34', 'DOMICILE', 'EXTÉRIEUR'),
(66, 'M-2733', NULL, NULL, 80, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:37:51', 'DOMICILE', 'EXTÉRIEUR'),
(67, 'M-4471', NULL, NULL, 81, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:44:21', 'DOMICILE', 'EXTÉRIEUR'),
(68, 'M-5470', NULL, NULL, 82, 0, 0, 0, 'SCHEDULED', '2026-01-16 15:50:29', 'DOMICILE', 'EXTÉRIEUR'),
(69, 'M-8905', NULL, NULL, 83, 0, 0, 0, 'SCHEDULED', '2026-01-17 12:58:53', 'DOMICILE', 'EXTÉRIEUR'),
(70, 'M-7830', NULL, NULL, 84, 0, 0, 0, 'SCHEDULED', '2026-01-20 12:43:36', 'DOMICILE', 'EXTÉRIEUR'),
(71, 'M-3279', NULL, NULL, 85, 0, 0, 0, 'SCHEDULED', '2026-01-20 12:46:19', 'DOMICILE', 'EXTÉRIEUR'),
(72, 'M-3015', NULL, NULL, 86, 0, 0, 0, 'SCHEDULED', '2026-01-21 11:12:58', 'DOMICILE', 'EXTÉRIEUR'),
(73, 'M-2549', NULL, NULL, 87, 0, 0, 0, 'SCHEDULED', '2026-01-21 11:15:23', 'DOMICILE', 'EXTÉRIEUR'),
(74, 'M-2627', NULL, NULL, 88, 0, 0, 0, 'SCHEDULED', '2026-01-22 11:22:24', 'DOMICILE', 'EXTÉRIEUR'),
(75, 'M-1626', NULL, NULL, 89, 0, 0, 0, 'SCHEDULED', '2026-01-23 09:08:39', 'DOMICILE', 'EXTÉRIEUR'),
(76, 'M-4269', NULL, NULL, 90, 0, 0, 0, 'SCHEDULED', '2026-01-23 09:12:45', 'DOMICILE', 'EXTÉRIEUR'),
(77, 'M-3176', NULL, NULL, 91, 0, 0, 0, 'SCHEDULED', '2026-01-23 09:35:37', 'DOMICILE', 'EXTÉRIEUR'),
(78, 'M-7519', NULL, NULL, 92, 0, 0, 0, 'SCHEDULED', '2026-01-26 14:45:41', 'DOMICILE', 'EXTÉRIEUR'),
(79, 'M-7473', NULL, NULL, 93, 0, 0, 0, 'SCHEDULED', '2026-01-26 16:19:07', 'DOMICILE', 'EXTÉRIEUR'),
(80, 'M-4783', NULL, NULL, 94, 0, 0, 0, 'SCHEDULED', '2026-01-26 18:15:19', 'DOMICILE', 'EXTÉRIEUR'),
(81, 'M-7905', NULL, NULL, 95, 0, 0, 0, 'SCHEDULED', '2026-01-27 08:59:58', 'DOMICILE', 'EXTÉRIEUR'),
(82, 'M-9592', NULL, NULL, 96, 0, 0, 0, 'SCHEDULED', '2026-01-27 09:23:17', 'DOMICILE', 'EXTÉRIEUR'),
(83, 'M-3749', NULL, NULL, 97, 0, 0, 0, 'SCHEDULED', '2026-01-27 10:01:36', 'DOMICILE', 'EXTÉRIEUR'),
(84, 'Jean-ADMIN-4081', NULL, NULL, 98, 0, 0, 0, 'SCHEDULED', '2026-01-27 10:14:23', 'DOMICILE', 'EXTÉRIEUR'),
(85, 'M-1588', NULL, NULL, 99, 0, 0, 0, 'SCHEDULED', '2026-01-27 10:35:05', 'DOMICILE', 'EXTÉRIEUR'),
(86, 'M-4931', NULL, NULL, 100, 0, 0, 0, 'SCHEDULED', '2026-01-27 11:21:19', 'DOMICILE', 'EXTÉRIEUR'),
(87, 'M-3725', NULL, NULL, 101, 0, 0, 0, 'SCHEDULED', '2026-01-27 14:11:40', 'DOMICILE', 'EXTÉRIEUR'),
(88, 'M-5706', NULL, NULL, 102, 0, 0, 0, 'SCHEDULED', '2026-01-27 14:52:52', 'DOMICILE', 'EXTÉRIEUR'),
(89, 'M-1126', NULL, NULL, 103, 0, 0, 0, 'SCHEDULED', '2026-01-27 15:02:02', 'DOMICILE', 'EXTÉRIEUR'),
(90, 'M-2255', NULL, NULL, 104, 0, 0, 0, 'SCHEDULED', '2026-01-27 15:47:57', 'DOMICILE', 'EXTÉRIEUR'),
(91, 'M-9547', NULL, NULL, 105, 0, 0, 0, 'SCHEDULED', '2026-01-27 15:52:04', 'DOMICILE', 'EXTÉRIEUR'),
(92, 'M-2563', NULL, NULL, 106, 0, 0, 0, 'SCHEDULED', '2026-01-27 15:58:29', 'DOMICILE', 'EXTÉRIEUR'),
(93, 'M-2015', NULL, NULL, 107, 0, 0, 0, 'SCHEDULED', '2026-01-27 15:59:18', 'DOMICILE', 'EXTÉRIEUR'),
(94, 'Client 2 (ADM-3285)', NULL, NULL, 108, 0, 0, 0, 'SCHEDULED', '2026-01-27 16:38:50', 'DOMICILE', 'EXTÉRIEUR'),
(95, 'M-8561', NULL, NULL, 109, 0, 0, 0, 'SCHEDULED', '2026-01-27 17:03:19', 'DOMICILE', 'EXTÉRIEUR'),
(96, 'M-1922', NULL, NULL, 110, 0, 0, 0, 'SCHEDULED', '2026-01-27 17:03:52', 'DOMICILE', 'EXTÉRIEUR'),
(97, 'M-2803', NULL, NULL, 111, 0, 0, 0, 'SCHEDULED', '2026-01-27 17:09:55', 'DOMICILE', 'EXTÉRIEUR'),
(98, 'Anis Benaiche (ADM-1', NULL, NULL, 112, 0, 0, 0, 'SCHEDULED', '2026-01-27 17:11:14', 'DOMICILE', 'EXTÉRIEUR'),
(99, 'M-2544', NULL, NULL, 113, 0, 0, 0, 'SCHEDULED', '2026-01-28 08:37:13', 'DOMICILE', 'EXTÉRIEUR'),
(100, 'M-6171', NULL, NULL, 114, 0, 0, 0, 'SCHEDULED', '2026-01-28 09:27:14', 'DOMICILE', 'EXTÉRIEUR'),
(101, 'M-1687', NULL, NULL, 115, 0, 0, 0, 'SCHEDULED', '2026-01-28 09:29:06', 'DOMICILE', 'EXTÉRIEUR'),
(102, 'M-2349', NULL, NULL, 116, 0, 0, 0, 'SCHEDULED', '2026-01-28 09:51:58', 'DOMICILE', 'EXTÉRIEUR'),
(103, 'M-6347', NULL, NULL, 117, 0, 0, 0, 'SCHEDULED', '2026-01-28 09:58:24', 'DOMICILE', 'EXTÉRIEUR'),
(104, 'M-5171', NULL, NULL, 118, 0, 0, 0, 'SCHEDULED', '2026-01-28 10:13:40', 'les chien loup', 'les chat magiques'),
(105, 'M-6486', NULL, NULL, 119, 0, 0, 0, 'SCHEDULED', '2026-01-28 13:09:06', 'DOMICILE', 'EXTÉRIEUR'),
(106, 'Mahmoudf (ADM-20902)', NULL, NULL, 120, 0, 0, 0, 'SCHEDULED', '2026-01-28 13:11:31', 'DOMICILE', 'EXTÉRIEUR'),
(107, 'M-8976', NULL, NULL, 121, 0, 0, 0, 'SCHEDULED', '2026-01-28 13:38:19', 'DOMICILE', 'PP'),
(108, 'M-9407', NULL, NULL, 122, 0, 0, 0, 'SCHEDULED', '2026-01-28 14:00:13', 'DOMICILE', 'EXTÉRIEUR'),
(109, 'M-5082', NULL, NULL, 123, 0, 0, 0, 'SCHEDULED', '2026-01-28 14:04:38', 'DOMICILE', 'EXTÉRIEUR'),
(110, 'M-5251', NULL, NULL, 124, 0, 0, 0, 'SCHEDULED', '2026-01-28 14:16:23', '222', 'EXTÉRIEUR'),
(111, 'M-7314', NULL, NULL, 125, 0, 0, 0, 'SCHEDULED', '2026-01-29 09:49:17', 'DOMICILE', 'EXTÉRIEUR'),
(112, 'M-4007', NULL, NULL, 126, 0, 0, 0, 'SCHEDULED', '2026-01-29 10:02:50', 'DOMICILE', 'EXTÉRIEUR'),
(113, 'M-8369', NULL, NULL, 127, 0, 0, 0, 'SCHEDULED', '2026-01-29 10:04:03', '9292', 'les lions'),
(114, 'anniversaire thomas ', NULL, NULL, 128, 0, 0, 0, 'SCHEDULED', '2026-01-29 10:16:47', 'DOMICILE', 'EXTÉRIEUR'),
(115, 'M-5175', NULL, NULL, 129, 0, 0, 0, 'SCHEDULED', '2026-01-29 10:28:40', 'DOMICILE', 'EXTÉRIEUR'),
(116, 'M-3847', NULL, NULL, 130, 0, 0, 0, 'SCHEDULED', '2026-01-29 10:43:46', 'DOMICILE', 'EXTÉRIEUR'),
(117, 'M-9612', NULL, NULL, 131, 0, 0, 0, 'SCHEDULED', '2026-01-29 11:03:39', 'DOMICILE', 'EXTÉRIEUR'),
(118, 'M-5652', NULL, NULL, 132, 0, 0, 0, 'SCHEDULED', '2026-01-30 08:58:02', 'les lions', 'les chats'),
(119, 'M-7053', NULL, NULL, 133, 0, 0, 0, 'SCHEDULED', '2026-01-30 09:07:51', 'les lions', 'les chats'),
(120, 'M-4142', NULL, NULL, 134, 0, 0, 0, 'SCHEDULED', '2026-01-30 09:10:17', 'DOMICILE', 'EXTÉRIEUR'),
(123, 'anniversaire mathis ', NULL, NULL, 137, 0, 0, 0, 'SCHEDULED', '2026-01-30 09:12:00', 'DOMICILE', 'EXTÉRIEUR'),
(124, 'M-5373', NULL, NULL, 138, 0, 0, 0, 'SCHEDULED', '2026-02-02 14:20:52', 'DOMICILE', 'EXTÉRIEUR');

-- --------------------------------------------------------

--
-- Structure de la table `match_invitations`
--

CREATE TABLE `match_invitations` (
  `id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `status` enum('PENDING','ACCEPTED','DECLINED') DEFAULT 'PENDING',
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `match_invitations`
--

INSERT INTO `match_invitations` (`id`, `match_id`, `sender_id`, `receiver_id`, `status`, `message`, `created_at`) VALUES
(1, 53, 4, 5, 'ACCEPTED', 'Anis vous invite au match M-8526', '2026-01-16 08:39:17'),
(2, 53, 4, 5, 'DECLINED', 'Anis vous invite au match M-8526', '2026-01-16 08:44:03'),
(3, 53, 4, 5, 'ACCEPTED', 'Anis vous invite au match M-8526', '2026-01-16 08:44:27'),
(4, 55, 4, 5, 'ACCEPTED', 'Anis vous invite au match M-8608', '2026-01-16 09:22:32'),
(5, 65, 13, 4, 'ACCEPTED', 'pirate vous invite au match M-4009', '2026-01-16 15:36:35'),
(6, 66, 13, 4, 'ACCEPTED', 'pirate vous offre une place gratuite pour le match M-2733', '2026-01-16 15:37:56'),
(7, 69, 4, 5, 'DECLINED', 'Anis vous invite au match M-8905', '2026-01-17 12:59:24'),
(8, 70, 4, 5, 'ACCEPTED', 'Anis vous invite au match M-7830', '2026-01-20 12:43:48'),
(9, 70, 4, 5, 'ACCEPTED', 'Anis vous invite au match M-7830', '2026-01-20 12:50:53'),
(10, 72, 4, 5, 'ACCEPTED', 'Anis vous invite au match M-3015', '2026-01-21 11:14:23'),
(11, 73, 4, 5, 'ACCEPTED', 'Anis vous offre une place gratuite pour le match M-2549', '2026-01-21 11:15:28'),
(12, 75, 4, 5, 'ACCEPTED', 'Anis vous invite au match M-1626', '2026-01-23 09:21:11'),
(13, 80, 4, 5, 'DECLINED', 'Anis vous offre une place gratuite pour le match M-4783', '2026-01-26 18:15:55'),
(14, 81, 4, 5, 'ACCEPTED', 'Anis vous offre une place gratuite pour le match M-7905', '2026-01-27 09:01:53'),
(15, 92, 4, 5, 'ACCEPTED', 'Anis vous offre une place pour le match M-2563', '2026-01-27 16:20:04'),
(16, 92, 4, 5, 'ACCEPTED', 'Anis vous offre une place pour le match M-2563', '2026-01-27 16:48:58'),
(17, 102, 4, 5, 'ACCEPTED', 'Anis vous offre une place pour le match M-2349', '2026-01-28 09:52:47'),
(18, 103, 4, 5, 'ACCEPTED', 'Anis vous offre une place pour le match M-6347', '2026-01-28 09:58:31');

-- --------------------------------------------------------

--
-- Structure de la table `match_participants`
--

CREATE TABLE `match_participants` (
  `id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `team_side` enum('A','B') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `has_paid` tinyint(1) DEFAULT 0,
  `goals` int(11) DEFAULT 0,
  `assists` int(11) DEFAULT 0,
  `rating` decimal(3,1) DEFAULT 6.0,
  `man_of_match` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `match_participants`
--

INSERT INTO `match_participants` (`id`, `match_id`, `user_id`, `team_side`, `created_at`, `has_paid`, `goals`, `assists`, `rating`, `man_of_match`) VALUES
(1, 7, 4, 'A', '2026-01-13 11:45:21', 1, 0, 0, 6.0, 0),
(2, 8, 4, 'A', '2026-01-13 11:52:55', 1, 0, 0, 6.0, 0),
(3, 9, 5, 'B', '2026-01-13 12:05:53', 1, 0, 0, 6.0, 0),
(4, 10, 4, 'A', '2026-01-13 12:07:05', 1, 0, 0, 6.0, 0),
(5, 11, 7, 'A', '2026-01-13 12:10:38', 1, 0, 0, 6.0, 0),
(6, 12, 5, 'A', '2026-01-13 12:10:53', 1, 0, 0, 6.0, 0),
(7, 13, 4, 'A', '2026-01-13 12:14:34', 1, 0, 0, 6.0, 0),
(8, 14, 5, 'A', '2026-01-13 12:15:16', 1, 0, 0, 6.0, 0),
(9, 15, 4, 'A', '2026-01-13 12:17:23', 1, 0, 0, 6.0, 0),
(10, 16, 5, 'A', '2026-01-13 12:17:45', 1, 0, 0, 6.0, 0),
(11, 17, 7, 'A', '2026-01-13 14:01:35', 1, 0, 0, 6.0, 0),
(13, 17, 4, 'B', '2026-01-13 14:13:50', 1, 0, 0, 6.0, 0),
(15, 18, 5, 'A', '2026-01-13 15:10:05', 1, 0, 0, 6.0, 0),
(16, 15, 5, 'A', '2026-01-13 15:25:40', 1, 0, 0, 6.0, 0),
(17, 19, 5, 'A', '2026-01-13 15:29:11', 1, 0, 0, 6.0, 0),
(20, 21, 5, 'A', '2026-01-13 16:38:46', 1, 0, 0, 6.0, 0),
(23, 23, 4, 'B', '2026-01-15 10:30:14', 1, 0, 0, 6.0, 0),
(24, 23, 6, 'A', '2026-01-15 10:30:23', 1, 0, 0, 6.0, 0),
(25, 23, 5, 'A', '2026-01-15 10:30:31', 1, 0, 0, 6.0, 0),
(29, 25, 4, 'A', '2026-01-15 10:39:45', 1, 0, 0, 6.0, 0),
(32, 26, 6, 'A', '2026-01-15 10:45:17', 1, 0, 0, 6.0, 0),
(33, 25, 6, 'A', '2026-01-15 10:45:34', 1, 0, 0, 6.0, 0),
(35, 25, 9, 'A', '2026-01-15 10:55:44', 1, 0, 0, 6.0, 0),
(37, 25, 5, 'A', '2026-01-15 11:14:42', 1, 0, 0, 6.0, 0),
(38, 27, 5, 'A', '2026-01-15 12:54:53', 1, 0, 0, 6.0, 0),
(39, 28, 4, 'A', '2026-01-15 12:55:45', 1, 0, 0, 6.0, 0),
(40, 29, 4, 'A', '2026-01-15 13:08:49', 1, 0, 0, 6.0, 0),
(41, 30, 5, 'A', '2026-01-15 13:09:24', 1, 0, 0, 6.0, 0),
(43, 31, 7, 'A', '2026-01-15 16:12:30', 1, 0, 0, 6.0, 0),
(44, 32, 7, 'A', '2026-01-15 16:27:30', 1, 0, 0, 6.0, 0),
(45, 32, 5, 'A', '2026-01-15 16:27:50', 1, 0, 0, 6.0, 0),
(53, 39, 4, 'A', '2026-01-15 20:57:21', 1, 0, 0, 6.0, 0),
(54, 40, 4, 'A', '2026-01-15 21:01:53', 1, 0, 0, 6.0, 0),
(58, 43, 9, 'A', '2026-01-15 21:08:06', 1, 0, 0, 6.0, 0),
(60, 43, 4, 'A', '2026-01-15 21:11:27', 1, 0, 0, 6.0, 0),
(68, 49, 4, 'A', '2026-01-16 08:05:31', 1, 0, 0, 6.0, 0),
(83, 57, 13, 'A', '2026-01-16 15:03:39', 1, 0, 0, 6.0, 0),
(91, 63, 13, 'A', '2026-01-16 15:21:53', 0, 0, 0, 6.0, 0),
(101, 67, 13, 'A', '2026-01-16 15:44:21', 1, 0, 0, 6.0, 0),
(108, 70, 4, 'A', '2026-01-20 12:43:36', 1, 0, 0, 6.0, 0),
(113, 70, 5, 'A', '2026-01-20 12:51:06', 1, 0, 0, 6.0, 0),
(121, 74, 4, 'A', '2026-01-22 11:22:24', 1, 0, 0, 6.0, 0),
(131, 79, 5, 'A', '2026-01-26 16:19:07', 1, 0, 0, 6.0, 0),
(132, 80, 4, 'A', '2026-01-26 18:15:19', 1, 0, 0, 6.0, 0),
(134, 81, 4, 'A', '2026-01-27 08:59:58', 1, 0, 0, 6.0, 0),
(135, 81, 5, 'A', '2026-01-27 09:02:00', 1, 0, 0, 6.0, 0),
(137, 82, 4, 'A', '2026-01-27 09:23:17', 1, 0, 0, 6.0, 0),
(138, 83, 4, 'A', '2026-01-27 10:01:36', 1, 0, 0, 6.0, 0),
(140, 86, 4, 'A', '2026-01-27 11:21:19', 1, 0, 0, 6.0, 0),
(143, 89, 4, 'A', '2026-01-27 15:02:02', 1, 0, 0, 6.0, 0),
(146, 92, 4, 'A', '2026-01-27 15:58:29', 1, 0, 0, 6.0, 0),
(150, 94, 4, 'A', '2026-01-27 16:39:28', 1, 0, 0, 6.0, 0),
(151, 94, 5, 'A', '2026-01-27 16:39:45', 1, 0, 0, 6.0, 0),
(178, 111, 4, 'A', '2026-01-29 09:49:17', 1, 0, 0, 6.0, 0),
(180, 113, 4, 'A', '2026-01-29 10:04:03', 1, 0, 0, 6.0, 0),
(181, 114, 4, 'A', '2026-01-29 10:17:05', 1, 0, 0, 6.0, 0),
(182, 115, 4, 'A', '2026-01-29 10:28:40', 1, 0, 0, 6.0, 0),
(183, 116, 4, 'A', '2026-01-29 10:43:46', 1, 0, 0, 6.0, 0),
(184, 117, 4, 'A', '2026-01-29 11:03:39', 1, 0, 0, 6.0, 0),
(185, 118, 5, 'A', '2026-01-30 08:58:02', 1, 0, 0, 6.0, 0),
(186, 119, 5, 'A', '2026-01-30 09:07:51', 1, 0, 0, 6.0, 0),
(187, 120, 5, 'A', '2026-01-30 09:10:17', 1, 0, 0, 6.0, 0),
(188, 124, 4, 'A', '2026-02-02 14:20:52', 1, 0, 0, 6.0, 0);

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `match_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `team_id`, `content`, `is_read`, `created_at`, `match_id`) VALUES
(1, 7, NULL, NULL, 'fvsgz', 0, '2026-01-13 14:15:42', 17),
(2, 5, NULL, NULL, 'salut toi', 0, '2026-01-13 14:15:53', 17),
(3, 4, NULL, NULL, '🔥🔥🔥', 0, '2026-01-13 14:16:19', 17),
(4, 7, NULL, NULL, 'hihi', 0, '2026-01-13 14:57:45', 17),
(5, 5, NULL, NULL, 'hihi', 0, '2026-01-13 15:32:02', 15),
(6, 4, NULL, NULL, '🔥🔥', 0, '2026-01-13 15:32:24', 15),
(7, 5, NULL, NULL, '🔥🔥🔥', 0, '2026-01-13 15:32:33', 15),
(8, 4, NULL, NULL, 'dfheje', 0, '2026-01-13 15:50:38', 20),
(9, 4, NULL, NULL, '213', 0, '2026-01-13 16:40:18', 18),
(10, 5, NULL, NULL, '🔥🔥', 0, '2026-01-13 16:40:26', 18),
(11, 5, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-15 10:40:49', 25),
(12, 4, NULL, NULL, '🔥🔥🔥', 0, '2026-01-15 10:52:58', 25),
(13, 5, NULL, NULL, '🔥🔥🔥', 0, '2026-01-15 11:27:28', 25),
(14, 5, NULL, NULL, 'qcqcqcx', 0, '2026-01-15 16:10:42', 30),
(15, 5, NULL, NULL, 'ww', 0, '2026-01-16 08:39:41', 53),
(16, 4, NULL, NULL, 'wey', 0, '2026-01-16 08:39:47', 53),
(17, 9, NULL, NULL, 'salut', 0, '2026-01-16 08:40:18', 53),
(18, 5, NULL, NULL, '🔥🔥🔥🔥🔥', 0, '2026-01-16 08:44:50', 53),
(19, 5, NULL, NULL, '😊😂😂🤣🤣💕👍😁', 0, '2026-01-16 08:44:58', 53),
(20, 5, NULL, NULL, 'kkk', 0, '2026-01-16 09:22:59', 55),
(21, 4, NULL, NULL, '🔥🔥🔥', 0, '2026-01-16 09:23:05', 55),
(22, 4, NULL, NULL, 'wwww', 0, '2026-01-16 15:46:15', 67),
(23, 13, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-16 15:46:20', 67),
(24, 5, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-23 09:22:02', 75),
(25, 4, NULL, NULL, '🔥🔥🔥', 0, '2026-01-23 09:22:09', 75),
(26, 5, NULL, NULL, '🔥🔥🔥', 0, '2026-01-23 09:24:46', 75),
(27, 4, NULL, NULL, '🔥🔥🔥🔥🔥🔥', 0, '2026-01-26 14:45:51', 78),
(28, 4, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-26 18:15:29', 80),
(29, 4, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-27 09:00:04', 81),
(30, 5, NULL, NULL, '🔥🔥🔥🔥🔥🔥', 0, '2026-01-27 09:02:11', 81),
(31, 4, NULL, NULL, '🔥🔥🔥🔥🔥🔥🔥', 0, '2026-01-27 16:02:12', 92),
(32, 4, NULL, NULL, '🔥🔥🔥', 0, '2026-01-27 16:39:35', 94),
(33, 5, NULL, NULL, '🔥🔥🔥', 0, '2026-01-27 16:39:48', 94),
(34, 5, NULL, NULL, '🔥🔥🔥🔥🔥', 0, '2026-01-27 16:46:33', 94),
(35, 5, NULL, NULL, '🔥🔥🔥', 0, '2026-01-27 16:46:36', 94),
(36, 5, NULL, NULL, '🔥🔥🔥', 0, '2026-01-28 08:37:44', 99),
(37, 4, NULL, NULL, 'hello', 0, '2026-01-28 08:37:50', 99),
(38, 4, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-28 10:17:23', 104),
(39, 5, NULL, NULL, 'je veux etre dans l\'equipe b', 0, '2026-01-28 10:18:53', 104),
(40, 4, NULL, NULL, 'ok', 0, '2026-01-28 10:18:58', 104),
(41, 4, NULL, NULL, 'c\'est bon jeune chat magique', 0, '2026-01-28 10:19:12', 104),
(42, 5, NULL, NULL, '🔥🔥🔥🔥🔥', 0, '2026-01-28 10:30:32', 104),
(43, 4, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-29 10:28:16', 111),
(44, 4, NULL, NULL, '🔥🔥🔥🔥🔥', 0, '2026-01-29 10:28:18', 111),
(45, 5, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-30 08:58:38', 118),
(46, 5, NULL, NULL, '🔥🔥🔥🔥', 0, '2026-01-30 09:20:04', 120);

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `match_id` int(11) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `action_url` varchar(255) DEFAULT NULL,
  `action_label` varchar(50) DEFAULT NULL,
  `notification_type` enum('INFO','SUCCESS','WARNING','INVITATION') DEFAULT 'INFO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `message`, `is_read`, `created_at`, `match_id`, `sender_id`, `action_url`, `action_label`, `notification_type`) VALUES
(2, 5, 'MATCH_INVITE', 'Anis t\'invite au match #33', 0, '2026-01-15 16:44:00', 33, 4, NULL, NULL, 'INFO'),
(3, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-8526', 0, '2026-01-16 08:39:17', 53, 4, '/match.html?id=53', 'Voir & Payer', 'INVITATION'),
(4, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-8526', 0, '2026-01-16 08:44:03', 53, 4, '/match.html?id=53', 'Voir & Payer', 'INVITATION'),
(5, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-8526', 0, '2026-01-16 08:44:27', 53, 4, '/match.html?id=53', 'Voir & Payer', 'INVITATION'),
(6, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-8608', 0, '2026-01-16 09:22:32', 55, 4, '/match.html?id=55', 'Voir & Payer', 'INVITATION'),
(7, 4, 'MATCH_INVITE_V2', 'pirate vous invite au match M-4009', 0, '2026-01-16 15:36:35', 65, 13, '/match.html?id=65', 'Voir & Payer', 'INVITATION'),
(8, 4, 'MATCH_INVITE_V2', 'pirate vous offre une place gratuite pour le match M-2733', 0, '2026-01-16 15:37:56', 66, 13, '/match.html?id=66', 'Accepter (Gratuit)', 'INVITATION'),
(9, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-8905', 0, '2026-01-17 12:59:24', 69, 4, '/match.html?id=69', 'Voir & Payer', 'INVITATION'),
(10, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-7830', 0, '2026-01-20 12:43:48', 70, 4, '/match.html?id=70', 'Voir & Payer', 'INVITATION'),
(11, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-7830', 0, '2026-01-20 12:50:53', 70, 4, '/match.html?id=70', 'Voir & Payer', 'INVITATION'),
(12, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-3015', 0, '2026-01-21 11:14:23', 72, 4, '/match.html?id=72', 'Voir & Payer', 'INVITATION'),
(13, 5, 'MATCH_INVITE_V2', 'Anis vous offre une place gratuite pour le match M-2549', 0, '2026-01-21 11:15:28', 73, 4, '/match.html?id=73', 'Accepter (Gratuit)', 'INVITATION'),
(14, 5, 'MATCH_INVITE_V2', 'Anis vous invite au match M-1626', 0, '2026-01-23 09:21:11', 75, 4, '/match.html?id=75', 'Voir & Payer', 'INVITATION'),
(15, 5, 'MATCH_INVITE_V2', 'Anis vous offre une place gratuite pour le match M-4783', 0, '2026-01-26 18:15:55', 80, 4, '/match.html?id=80', 'Accepter (Gratuit)', 'INVITATION'),
(16, 5, 'MATCH_INVITE_V2', 'Anis vous offre une place gratuite pour le match M-7905', 0, '2026-01-27 09:01:53', 81, 4, '/match.html?id=81', 'Accepter (Gratuit)', 'INVITATION'),
(17, 4, 'MATCH_CANCELLED', 'Le match M-4931 a été annulé par l\'admin.', 0, '2026-01-27 15:43:42', NULL, NULL, '/dashboard-joueur.html', 'Compris', ''),
(18, 5, 'MATCH_INVITE_V2', 'Anis vous offre une place pour le match M-2563', 0, '2026-01-27 16:20:04', 92, 4, '/match.html?id=92', 'Accepter', 'INVITATION'),
(19, 5, 'KICKED', 'Vous avez été exclu du match.', 0, '2026-01-27 16:30:38', NULL, NULL, NULL, NULL, 'INFO'),
(20, 4, 'MATCH_CANCELLED', 'Le match M-1126 a été annulé par l\'admin.', 0, '2026-01-27 16:34:09', NULL, NULL, '/dashboard-joueur.html', 'Compris', ''),
(21, 5, 'MATCH_INVITE_V2', 'Anis vous offre une place pour le match M-2563', 0, '2026-01-27 16:48:58', 92, 4, '/match.html?id=92', 'Accepter', 'INVITATION'),
(22, 5, 'KICKED', 'Vous avez été exclu du match.', 0, '2026-01-27 16:49:20', NULL, NULL, NULL, NULL, 'INFO'),
(23, 4, 'MATCH_CANCELLED', 'Le match M-2563 a été annulé par l\'admin.', 0, '2026-01-27 17:01:36', NULL, NULL, '/dashboard-joueur.html', 'Compris', ''),
(24, 4, 'MATCH_CANCELLED', 'Le match Client 2 (ADM-3285) a été annulé par l\'admin.', 0, '2026-01-27 17:01:40', NULL, NULL, '/dashboard-joueur.html', 'Compris', ''),
(25, 5, 'MATCH_CANCELLED', 'Le match Client 2 (ADM-3285) a été annulé par l\'admin.', 0, '2026-01-27 17:01:40', NULL, NULL, '/dashboard-joueur.html', 'Compris', ''),
(26, 5, 'MATCH_INVITE_V2', 'Anis vous offre une place pour le match M-2349', 0, '2026-01-28 09:52:47', 102, 4, '/match.html?id=102', 'Accepter', 'INVITATION'),
(27, 5, 'KICKED', 'Vous avez été exclu du match.', 0, '2026-01-28 09:53:08', NULL, NULL, NULL, NULL, 'INFO'),
(28, 5, 'MATCH_INVITE_V2', 'Anis vous offre une place pour le match M-6347', 0, '2026-01-28 09:58:31', 103, 4, '/match.html?id=103', 'Accepter', 'INVITATION'),
(29, 5, 'KICKED', 'Vous avez été exclu du match.', 0, '2026-01-28 10:17:47', NULL, NULL, NULL, NULL, 'INFO');

-- --------------------------------------------------------

--
-- Structure de la table `player_sanctions`
--

CREATE TABLE `player_sanctions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `complex_id` int(11) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `ban_type` enum('TEMPORARY','PERMANENT') DEFAULT 'TEMPORARY',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `pricing_rules`
--

CREATE TABLE `pricing_rules` (
  `id` int(11) NOT NULL,
  `complex_id` int(11) NOT NULL,
  `terrain_id` int(11) DEFAULT NULL,
  `day_type` enum('WEEKDAY','WEEKEND','HOLIDAY') DEFAULT 'WEEKDAY',
  `time_type` enum('PEAK','OFF_PEAK') DEFAULT 'PEAK',
  `start_hour` time NOT NULL,
  `end_hour` time NOT NULL,
  `price_modifier` decimal(5,2) DEFAULT 1.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `pricing_rules`
--

INSERT INTO `pricing_rules` (`id`, `complex_id`, `terrain_id`, `day_type`, `time_type`, `start_hour`, `end_hour`, `price_modifier`, `is_active`, `created_at`) VALUES
(3, 1, NULL, 'WEEKDAY', 'PEAK', '18:00:00', '23:00:00', 2.00, 1, '2026-01-27 17:02:18'),
(4, 1, NULL, 'WEEKEND', 'PEAK', '00:00:00', '23:59:00', 2.00, 1, '2026-01-27 17:02:18');

-- --------------------------------------------------------

--
-- Structure de la table `promo_codes`
--

CREATE TABLE `promo_codes` (
  `id` int(11) NOT NULL,
  `complex_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('PERCENT','FIXED') NOT NULL DEFAULT 'PERCENT',
  `value` decimal(10,2) NOT NULL,
  `max_uses` int(11) DEFAULT 100,
  `current_uses` int(11) DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `promo_codes`
--

INSERT INTO `promo_codes` (`id`, `complex_id`, `code`, `discount_type`, `value`, `max_uses`, `current_uses`, `expires_at`, `is_active`, `created_at`) VALUES
(3, 1, 'OUVERTURE', 'PERCENT', 50.00, 100, 0, '2026-02-10 00:00:00', 1, '2026-01-30 09:07:32');

-- --------------------------------------------------------

--
-- Structure de la table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `terrain_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('PENDING','CONFIRMED','CANCELLED','COMPLETED','PENDING_PAYMENT') DEFAULT 'CONFIRMED',
  `payment_status` enum('PAID','UNPAID','REFUNDED') DEFAULT 'UNPAID',
  `payment_method` varchar(50) DEFAULT NULL,
  `stripe_payment_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_mode` enum('FULL','SPLIT') DEFAULT 'FULL',
  `slots_paid` int(11) DEFAULT 0,
  `min_players` int(11) DEFAULT 8,
  `expires_at` datetime DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `invoice_url` varchar(255) DEFAULT NULL,
  `source` enum('WEB','APP','PHONE','COUNTER') DEFAULT 'WEB'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `reservations`
--

INSERT INTO `reservations` (`id`, `user_id`, `terrain_id`, `start_time`, `end_time`, `total_price`, `status`, `payment_status`, `payment_method`, `stripe_payment_id`, `created_at`, `payment_mode`, `slots_paid`, `min_players`, `expires_at`, `is_public`, `invoice_url`, `source`) VALUES
(17, 4, 3, '2026-01-13 13:00:00', '2026-01-13 13:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 11:03:39', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(18, 4, 3, '2026-01-13 10:00:00', '2026-01-13 10:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 11:27:44', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(19, 4, 7, '2026-01-15 12:00:00', '2026-01-15 12:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 11:28:15', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(20, 4, 3, '2026-01-13 15:00:00', '2026-01-13 15:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 11:31:43', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(21, 4, 3, '2026-01-13 12:00:00', '2026-01-13 12:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 11:45:21', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(22, 4, 11, '2026-01-13 11:00:00', '2026-01-13 11:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 11:52:55', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(23, 5, 11, '2026-01-14 11:00:00', '2026-01-14 11:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 12:05:53', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(24, 4, 11, '2026-01-14 11:00:00', '2026-01-14 11:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 12:07:05', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(25, 7, 3, '2026-01-13 22:00:00', '2026-01-13 22:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 12:10:38', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(26, 5, 3, '2026-01-13 22:00:00', '2026-01-13 22:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 12:10:53', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(27, 4, 3, '2026-01-14 11:00:00', '2026-01-14 11:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 12:14:34', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(28, 5, 3, '2026-01-14 11:00:00', '2026-01-14 11:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 12:15:16', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(29, 4, 3, '2026-01-13 20:00:00', '2026-01-13 20:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 12:17:23', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(30, 5, 3, '2026-01-13 19:00:00', '2026-01-13 19:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 12:17:45', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(31, 7, 11, '2026-01-13 21:00:00', '2026-01-13 21:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 14:01:35', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(32, 5, 3, '2026-01-14 13:00:00', '2026-01-14 13:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 15:10:05', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(33, 5, 11, '2026-01-13 22:00:00', '2026-01-13 22:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 15:29:11', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(34, 4, 3, '2026-01-13 13:00:00', '2026-01-13 13:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 15:50:17', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(35, 5, 3, '2026-01-13 11:00:00', '2026-01-13 11:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 16:38:46', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(36, 4, 11, '2026-01-14 12:00:00', '2026-01-14 12:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-13 16:45:50', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(37, 4, 11, '2026-01-16 19:00:00', '2026-01-16 19:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 10:30:14', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(38, 4, 11, '2026-01-15 11:00:00', '2026-01-15 11:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 10:35:40', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(39, 4, 11, '2026-01-15 14:00:00', '2026-01-15 14:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 10:39:45', 'SPLIT', 8, 8, NULL, 1, NULL, 'WEB'),
(40, 6, 11, '2026-01-15 19:00:00', '2026-01-15 20:00:00', 40.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 10:45:17', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(41, 5, 11, '2026-01-15 12:00:00', '2026-01-15 13:00:00', 40.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 12:54:53', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(42, 4, 11, '2026-01-18 11:00:00', '2026-01-18 11:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 12:55:45', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(43, 4, 11, '2026-01-15 20:00:00', '2026-01-15 20:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 13:08:49', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(44, 5, 11, '2026-01-15 22:00:00', '2026-01-15 22:00:00', 20.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 13:09:24', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(45, 7, 7, '2026-01-15 12:00:00', '2026-01-15 13:00:00', 120.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 16:12:30', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(46, 7, 7, '2026-01-16 14:00:00', '2026-01-16 14:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 16:27:30', 'SPLIT', 2, 8, NULL, 1, NULL, 'WEB'),
(47, 4, 3, '2026-01-16 13:00:00', '2026-01-16 13:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 16:43:10', NULL, 10, 8, NULL, 1, NULL, 'WEB'),
(48, 5, 7, '2026-01-15 13:00:00', '2026-01-15 13:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 16:49:35', NULL, 10, 8, NULL, 0, NULL, 'WEB'),
(49, 4, 7, '2026-01-16 14:00:00', '2026-01-16 14:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 16:56:51', NULL, 10, 8, NULL, 1, NULL, 'WEB'),
(50, 4, 3, '2026-01-15 11:00:00', '2026-01-15 11:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 20:31:27', NULL, 10, 8, NULL, 0, NULL, 'WEB'),
(51, 4, 11, '2026-01-16 17:00:00', '2026-01-16 17:00:00', 20.00, 'CONFIRMED', 'UNPAID', NULL, NULL, '2026-01-15 20:31:46', NULL, 10, 8, NULL, 0, NULL, 'WEB'),
(52, 4, 7, '2026-01-15 14:00:00', '2026-01-15 14:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 20:54:54', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(53, 4, 7, '2026-01-15 14:00:00', '2026-01-15 14:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 20:57:21', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(54, 4, 7, '2026-01-15 19:00:00', '2026-01-15 19:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 21:01:53', 'SPLIT', 1, 8, NULL, 1, NULL, 'WEB'),
(55, 4, 7, '2026-01-15 19:00:00', '2026-01-15 19:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 21:05:31', 'SPLIT', 1, 8, NULL, 1, NULL, 'WEB'),
(56, 4, 7, '2026-01-15 20:00:00', '2026-01-15 20:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 21:07:24', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(57, 4, 3, '2026-01-19 19:00:00', '2026-01-19 19:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 21:07:44', 'SPLIT', 3, 8, NULL, 1, NULL, 'WEB'),
(58, 4, 7, '2026-01-15 14:00:00', '2026-01-15 14:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 21:12:00', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(59, 4, 7, '2026-01-15 14:00:00', '2026-01-15 14:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 21:12:17', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(60, 5, 12, '2026-01-16 12:00:00', '2026-01-16 12:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 22:56:19', 'SPLIT', 3, 8, NULL, 1, NULL, 'WEB'),
(61, 5, 13, '2026-01-16 12:00:00', '2026-01-16 12:00:00', 4.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 23:00:54', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(62, 5, 7, '2026-01-17 22:00:00', '2026-01-17 22:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-15 23:08:24', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(63, 4, 13, '2026-01-16 11:00:00', '2026-01-16 11:00:00', 4.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 08:05:31', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(64, 5, 7, '2026-01-17 20:00:00', '2026-01-17 20:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 08:14:47', 'SPLIT', 2, 8, NULL, 1, NULL, 'WEB'),
(65, 4, 12, '2026-01-16 13:00:00', '2026-01-16 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 08:30:47', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(66, 4, 12, '2026-01-17 20:00:00', '2026-01-17 20:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 08:38:42', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(67, 4, 12, '2026-01-16 13:00:00', '2026-01-16 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 08:38:51', 'SPLIT', 4, 8, NULL, 0, NULL, 'WEB'),
(68, 4, 13, '2026-01-17 13:00:00', '2026-01-17 13:00:00', 4.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 09:21:40', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(69, 4, 12, '2026-01-18 14:00:00', '2026-01-18 14:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 09:22:13', 'SPLIT', 3, 8, NULL, 0, NULL, 'WEB'),
(70, 10, 12, '2026-01-21 14:00:00', '2026-01-21 14:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 09:27:09', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(71, 13, 12, '2026-01-16 12:00:00', '2026-01-16 12:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:03:39', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(72, 13, 12, '2026-01-20 14:00:00', '2026-01-20 14:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:04:11', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(73, 13, 12, '2026-01-16 12:00:00', '2026-01-16 12:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:09:58', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(74, 13, 12, '2026-01-17 21:00:00', '2026-01-17 21:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:18:47', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(75, 13, 12, '2026-01-19 15:00:00', '2026-01-19 15:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:19:25', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(76, 13, 12, '2026-01-18 13:00:00', '2026-01-18 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:20:34', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(77, 13, 3, '2026-01-20 14:00:00', '2026-01-20 14:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:21:53', 'FULL', 0, 8, NULL, 0, NULL, 'WEB'),
(78, 13, 12, '2026-01-16 13:00:00', '2026-01-16 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:32:52', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(79, 13, 3, '2026-01-17 21:00:00', '2026-01-17 21:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:33:34', 'SPLIT', 2, 8, NULL, 1, NULL, 'WEB'),
(80, 13, 12, '2026-01-22 14:00:00', '2026-01-22 14:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:37:51', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(81, 13, 12, '2026-01-19 07:30:00', '2026-01-19 08:30:00', 100.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:44:21', 'SPLIT', 2, 8, NULL, 1, NULL, 'WEB'),
(82, 4, 12, '2026-01-18 13:00:00', '2026-01-18 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-16 15:50:29', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(83, 4, 3, '2026-01-19 14:00:00', '2026-01-19 14:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-17 12:58:53', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(84, 4, 13, '2026-01-22 12:00:00', '2026-01-22 12:00:00', 4.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-20 12:43:36', 'SPLIT', 4, 8, NULL, 0, NULL, 'WEB'),
(85, 5, 7, '2026-01-22 19:00:00', '2026-01-22 19:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-20 12:46:19', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(86, 4, 13, '2026-01-21 11:00:00', '2026-01-21 11:00:00', 4.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-21 11:12:58', 'SPLIT', 2, 8, NULL, 0, NULL, 'WEB'),
(87, 4, 12, '2026-01-23 14:00:00', '2026-01-23 14:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-21 11:15:23', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(88, 4, 12, '2026-01-23 14:00:00', '2026-01-23 14:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-22 11:22:24', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(89, 4, 12, '2026-01-24 11:00:00', '2026-01-24 12:00:00', 100.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-23 09:08:39', 'SPLIT', 4, 8, NULL, 1, NULL, 'WEB'),
(90, 5, 13, '2026-01-23 11:00:00', '2026-01-23 11:00:00', 4.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-23 09:12:45', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(91, 5, 12, '2026-01-25 20:00:00', '2026-01-25 21:00:00', 100.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-23 09:35:37', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(92, 4, 15, '2026-01-28 09:30:00', '2026-01-28 10:30:00', 100.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-26 14:45:41', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(93, 5, 12, '2026-01-28 16:00:00', '2026-01-28 17:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-26 16:19:07', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(94, 4, 14, '2026-01-31 10:00:00', '2026-01-31 11:00:00', 11.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-26 18:15:19', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(95, 4, 3, '2026-01-29 13:00:00', '2026-01-29 13:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 08:59:58', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(96, 4, 7, '2026-01-30 12:00:00', '2026-01-30 12:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 09:23:17', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(97, 4, 13, '2026-01-31 11:00:00', '2026-01-31 12:00:00', 4.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 10:01:36', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(98, 7, 3, '2026-01-27 10:00:00', '2026-01-27 11:30:00', 130.50, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 10:14:23', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(99, 4, 3, '2026-01-27 13:00:00', '2026-01-27 13:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 10:35:05', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(100, 4, 12, '2026-01-30 10:00:00', '2026-01-30 11:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 11:21:19', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(101, 4, 12, '2026-01-27 13:00:00', '2026-01-27 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 14:11:40', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(102, 4, 12, '2026-01-27 13:00:00', '2026-01-27 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 14:52:52', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(103, 4, 12, '2026-01-28 13:00:00', '2026-01-28 14:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 15:02:02', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(104, 4, 12, '2026-01-29 13:00:00', '2026-01-29 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 15:47:57', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(105, 4, 12, '2026-01-30 13:00:00', '2026-01-30 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 15:52:04', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(106, 4, 12, '2026-01-31 10:00:00', '2026-01-31 11:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 15:58:29', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(107, 4, 12, '2026-01-27 13:00:00', '2026-01-27 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 15:59:18', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(108, 7, 3, '2026-01-28 15:00:00', '2026-01-28 17:00:00', 174.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 16:38:50', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(109, 5, 12, '2026-01-27 11:00:00', '2026-01-27 11:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 17:03:19', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(110, 5, 12, '2026-01-31 12:00:00', '2026-01-31 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 17:03:52', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(111, 4, 15, '2026-01-30 09:00:00', '2026-01-30 10:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 17:09:55', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(112, 7, 3, '2026-01-27 16:00:00', '2026-01-27 17:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-27 17:11:13', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(113, 4, 3, '2026-01-31 21:00:00', '2026-01-31 21:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 08:37:13', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(114, 5, 15, '2026-01-28 14:00:00', '2026-01-28 14:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 09:27:14', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(115, 5, 3, '2026-02-01 14:00:00', '2026-02-01 14:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 09:29:06', 'SPLIT', 2, 8, NULL, 1, NULL, 'WEB'),
(116, 4, 12, '2026-02-01 22:00:00', '2026-02-01 22:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 09:51:58', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(117, 4, 3, '2026-02-01 14:00:00', '2026-02-01 14:00:00', 87.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 09:58:24', 'FULL', 10, 8, NULL, 1, NULL, 'WEB'),
(118, 4, 15, '2026-02-02 07:00:00', '2026-02-02 08:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 10:13:40', 'SPLIT', 3, 8, NULL, 1, NULL, 'WEB'),
(119, 4, 12, '2026-01-30 12:00:00', '2026-01-30 12:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 13:09:06', 'FULL', 10, 8, NULL, 0, NULL, 'WEB'),
(120, 7, 12, '2026-01-30 17:00:00', '2026-01-30 19:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 13:11:31', 'FULL', 10, 8, NULL, 0, NULL, ''),
(121, 4, 7, '2026-01-30 13:00:00', '2026-01-30 13:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 13:38:19', 'SPLIT', 1, 8, NULL, 1, NULL, 'WEB'),
(122, 4, 12, '2026-01-30 12:00:00', '2026-01-30 13:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 14:00:13', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(123, 4, 7, '2026-01-30 20:00:00', '2026-01-30 21:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 14:04:38', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(124, 4, 7, '2026-02-02 14:00:00', '2026-02-02 15:00:00', 120.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-28 14:16:23', 'SPLIT', 1, 8, NULL, 1, NULL, 'WEB'),
(125, 4, 17, '2026-01-30 08:30:00', '2026-01-30 09:30:00', 100.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-29 09:49:17', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(126, 4, 17, '2026-01-29 14:00:00', '2026-01-29 14:00:00', 100.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-29 10:02:50', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(127, 4, 12, '2026-01-30 08:30:00', '2026-01-30 09:30:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-29 10:04:03', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(128, 7, 12, '2026-01-31 11:00:00', '2026-01-31 12:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-29 10:16:47', 'FULL', 10, 8, NULL, 0, NULL, ''),
(129, 4, 12, '2026-01-30 19:00:00', '2026-01-30 19:00:00', 50.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-29 10:28:40', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(130, 4, 7, '2026-01-30 09:30:00', '2026-01-30 10:30:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-29 10:43:46', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(131, 4, 7, '2026-01-29 12:00:00', '2026-01-29 13:00:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-29 11:03:39', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(132, 5, 12, '2026-01-30 15:00:00', '2026-01-30 16:00:00', 100.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-30 08:58:02', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(133, 5, 17, '2026-01-30 12:00:00', '2026-01-30 12:00:00', 100.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-30 09:07:51', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(134, 5, 7, '2026-02-04 12:30:00', '2026-02-04 13:30:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-30 09:10:17', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB'),
(137, 7, 17, '2026-01-30 08:30:00', '2026-01-30 09:30:00', 60.00, 'CANCELLED', 'UNPAID', NULL, NULL, '2026-01-30 09:12:00', 'FULL', 0, 8, NULL, 0, NULL, ''),
(138, 4, 17, '2026-02-03 11:30:00', '2026-02-03 12:30:00', 100.00, 'CONFIRMED', 'UNPAID', NULL, NULL, '2026-02-02 14:20:52', 'SPLIT', 1, 8, NULL, 0, NULL, 'WEB');

-- --------------------------------------------------------

--
-- Structure de la table `teams`
--

CREATE TABLE `teams` (
  `id` int(11) NOT NULL,
  `captain_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sport_type` enum('FOOT5','BASKET','PADEL','TENNIS') DEFAULT 'FOOT5',
  `logo_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `level_score` int(11) DEFAULT 1000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `invite_code` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `teams`
--

INSERT INTO `teams` (`id`, `captain_id`, `name`, `sport_type`, `logo_url`, `description`, `level_score`, `created_at`, `invite_code`) VALUES
(5, 4, 'a', 'FOOT5', NULL, NULL, 1000, '2026-01-12 22:33:12', 'A-6610');

-- --------------------------------------------------------

--
-- Structure de la table `team_members`
--

CREATE TABLE `team_members` (
  `id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` varchar(20) DEFAULT 'PLAYER',
  `position` varchar(50) DEFAULT 'Polyvalent',
  `jersey_number` int(11) DEFAULT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `team_members`
--

INSERT INTO `team_members` (`id`, `team_id`, `user_id`, `role`, `position`, `jersey_number`, `joined_at`) VALUES
(6, 5, 4, 'CAPTAIN', 'Polyvalent', NULL, '2026-01-12 22:33:12');

-- --------------------------------------------------------

--
-- Structure de la table `terrains`
--

CREATE TABLE `terrains` (
  `id` int(11) NOT NULL,
  `complex_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sport_type` enum('FOOT5','BASKET','PADEL','TENNIS') DEFAULT 'FOOT5',
  `surface_type` varchar(50) DEFAULT NULL,
  `is_indoor` tinyint(1) DEFAULT 1,
  `has_camera` tinyint(1) DEFAULT 0,
  `hourly_rate` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `priority` int(11) DEFAULT 1,
  `maintenance_status` enum('AVAILABLE','MAINTENANCE','CLOSED') DEFAULT 'AVAILABLE',
  `last_maintenance` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `terrains`
--

INSERT INTO `terrains` (`id`, `complex_id`, `name`, `sport_type`, `surface_type`, `is_indoor`, `has_camera`, `hourly_rate`, `description`, `is_active`, `created_at`, `features`, `priority`, `maintenance_status`, `last_maintenance`) VALUES
(3, 1, 'Terrain 1', 'FOOT5', 'Parquet', 1, 1, 87.00, '25m x 15m • Capacité 10 Joueurs', 0, '2026-01-12 12:52:48', '{\"lighting\":1,\"heating\":1}', 1, 'AVAILABLE', NULL),
(7, 1, 'Court Jordan', 'BASKET', 'Parquet NBA', 1, 0, 60.00, '28m x 15m • Panneaux Plexiglas', 0, '2026-01-12 14:11:40', '{\"camera\": 0, \"lighting\": 1, \"heating\": 1}', 1, 'MAINTENANCE', NULL),
(11, 2, 'terrain92', 'FOOT5', NULL, 1, 0, 20.00, NULL, 1, '2026-01-13 11:50:32', '{\"camera\": 0, \"lighting\": 1, \"heating\": 1}', 1, 'AVAILABLE', NULL),
(12, 1, 'terrain1', 'FOOT5', 'Synthétique', 1, 1, 50.00, '', 1, '2026-01-15 22:40:09', '{\"lighting\":1,\"heating\":1}', 1, 'AVAILABLE', NULL),
(13, 1, 'tennis', 'TENNIS', NULL, 1, 0, 4.00, NULL, 0, '2026-01-15 23:00:24', NULL, 1, 'MAINTENANCE', NULL),
(14, 1, 'realfive', 'FOOT5', NULL, 1, 0, 11.00, NULL, 0, '2026-01-23 09:30:14', NULL, 1, 'AVAILABLE', NULL),
(15, 1, 'azerty', 'FOOT5', NULL, 1, 0, 50.00, NULL, 0, '2026-01-23 09:45:17', NULL, 1, 'AVAILABLE', NULL),
(17, 1, 'TERRAIN 2', 'FOOT5', 'Synthétique', 1, 1, 100.00, NULL, 1, '2026-01-28 14:17:08', '{\"lighting\":1,\"heating\":1}', 1, 'AVAILABLE', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `tournaments`
--

CREATE TABLE `tournaments` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `date_tournament` datetime NOT NULL,
  `entry_fee` decimal(10,2) NOT NULL,
  `prize` varchar(255) NOT NULL,
  `max_teams` int(11) NOT NULL,
  `current_teams` int(11) DEFAULT 0,
  `status` enum('open','launched','finished') DEFAULT 'open',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tournament_entries`
--

CREATE TABLE `tournament_entries` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `team_name` varchar(100) NOT NULL,
  `captain_id` int(11) NOT NULL,
  `payment_status` enum('pending','paid') DEFAULT 'pending',
  `entry_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `friend_code` varchar(10) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('JOUEUR','PRO','ADMIN') DEFAULT 'JOUEUR',
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `referral_code` varchar(50) DEFAULT NULL,
  `referred_by` int(11) DEFAULT NULL,
  `wallet_balance` decimal(10,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notify_email` tinyint(1) DEFAULT 1,
  `notify_sms` tinyint(1) DEFAULT 0,
  `position` varchar(50) DEFAULT 'Polyvalent',
  `jersey_number` int(11) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_code` varchar(6) DEFAULT NULL,
  `two_factor_code` varchar(6) DEFAULT NULL,
  `two_factor_expires` datetime DEFAULT NULL,
  `reset_token` varchar(64) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `ban_expires_at` datetime DEFAULT NULL,
  `ban_reason` varchar(255) DEFAULT NULL,
  `loyalty_points` int(11) DEFAULT 0,
  `internal_notes` text DEFAULT NULL,
  `client_tag` enum('REGULAR','VIP','NEW','BAD_PAYER') DEFAULT 'NEW'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `friend_code`, `email`, `password_hash`, `role`, `first_name`, `last_name`, `phone`, `avatar_url`, `bio`, `referral_code`, `referred_by`, `wallet_balance`, `is_active`, `created_at`, `notify_email`, `notify_sms`, `position`, `jersey_number`, `is_verified`, `verification_code`, `two_factor_code`, `two_factor_expires`, `reset_token`, `reset_expires`, `ban_expires_at`, `ban_reason`, `loyalty_points`, `internal_notes`, `client_tag`) VALUES
(1, 'U-80690', 'admin@realfive.com', '$2b$10$3ENcyx125AyAWGqG92t19OuVlNnnBsVDWdfKLqgIm6HqVaKs2GSI6', 'ADMIN', 'Super', 'Admin', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-01-12 11:33:39', 1, 0, 'Polyvalent', NULL, 1, NULL, NULL, '2026-01-22 12:43:06', NULL, NULL, NULL, NULL, 0, NULL, 'NEW'),
(4, 'U-39081', 'anis.benaiche92@gmail.com', '$2b$10$pdur6jlMKbtsftcu58wwwOzJZsGlEjMETOmnuCtDvgrKy/Eho6166', 'JOUEUR', 'Anis', 'Benaiche', '0745657407', '/uploads/avatar-1768235788184.png', 'zz', 'ANI9810', NULL, 0.00, 1, '2026-01-12 11:42:42', 1, 0, 'Défenseur', 3, 1, NULL, NULL, '2026-02-02 15:18:56', '2168e871502018b58c52fac5ad3b370cc87ed0dd3603486428390f672ef74f4d', '2026-01-22 13:31:18', NULL, NULL, 0, NULL, 'NEW'),
(5, 'U-97914', 'sami.ouail08@gmail.com', '$2b$10$meqDMBp7ok4KetNl8uh0XONocMihA.9Wwc4nEfBZD0SWCJPC9Q0qm', 'JOUEUR', 'sami', 'ouail', '', '/uploads/avatar-1768235602659.png', 'miaou', 'SAM8616', NULL, 0.00, 1, '2026-01-12 15:12:43', 1, 0, 'Défenseur', 92, 1, NULL, NULL, '2026-01-30 10:13:25', NULL, NULL, NULL, NULL, 0, NULL, 'NEW'),
(6, 'U-92326', 'mehdi.jarraya@enedix.fr', '$2b$10$./KC9czXreHllfacAFJcI.7PtBfNFl7.BOPrtYG/dAdqxI8i8749K', 'JOUEUR', 'Mehdi ', 'Jarraya', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-01-12 16:51:52', 1, 0, 'Polyvalent', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'NEW'),
(7, 'U-67887', 'admin@realfive.fr', '$2b$10$0i82oHJ13q45QQBau2.B3Ome81qnoSeeQDt7UT9ekNEropJI4Sc2C', 'ADMIN', 'admin', 'admin', NULL, NULL, NULL, 'ADM590', NULL, 0.00, 1, '2026-01-13 09:25:18', 1, 0, 'Polyvalent', NULL, 1, NULL, NULL, '2026-02-02 15:42:12', NULL, NULL, NULL, NULL, 0, NULL, 'NEW'),
(9, '#RF-2344', 'a@a.fr', '$2b$10$LYEqjTOQ9VUru5mDCWBdC.G/n8tNBYRT8Ks5K.SUAl5CBCZQX5mM6', 'JOUEUR', 'a', 'a', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-01-15 10:55:30', 1, 0, 'Polyvalent', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'NEW'),
(10, '#RF-8004', 'enedix@endix.fr', '$2b$10$eLsKC6hkH08L49EWOO4QK.asu4Ea5KAdtkwMxjQaK3kC5/BcBdbD6', 'JOUEUR', 'Enedix', 'Enedix', '0767135659', '/uploads/avatar-1768555663820.png', '', NULL, NULL, 0.00, 1, '2026-01-16 09:25:43', 1, 0, 'Polyvalent', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'NEW'),
(13, '#RF-1979', 'anislbgd92@gmail.com', '$2b$10$1OlpGDwQpKaX3SwdbAEPxuElhrV2h4kRAvAbEYzLHydET0iAQUHZi', 'ADMIN', 'pirate', 'pirate', '0404040744', NULL, NULL, NULL, NULL, 0.00, 1, '2026-01-16 14:40:53', 1, 0, 'Polyvalent', NULL, 1, NULL, NULL, '2026-01-22 12:37:52', NULL, NULL, NULL, NULL, 0, NULL, 'NEW');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `championships`
--
ALTER TABLE `championships`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complex_id` (`complex_id`);

--
-- Index pour la table `complexes`
--
ALTER TABLE `complexes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Index pour la table `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_friendship` (`user_id`,`friend_id`),
  ADD KEY `friend_id` (`friend_id`);

--
-- Index pour la table `friend_requests`
--
ALTER TABLE `friend_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_request` (`sender_id`,`receiver_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Index pour la table `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `match_code` (`match_code`),
  ADD KEY `team_home_id` (`team_home_id`),
  ADD KEY `team_away_id` (`team_away_id`),
  ADD KEY `reservation_id` (`reservation_id`);

--
-- Index pour la table `match_invitations`
--
ALTER TABLE `match_invitations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Index pour la table `match_participants`
--
ALTER TABLE `match_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_player_match` (`match_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `team_id` (`team_id`),
  ADD KEY `fk_message_match` (`match_id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_notif_match` (`match_id`),
  ADD KEY `fk_notif_sender` (`sender_id`);

--
-- Index pour la table `player_sanctions`
--
ALTER TABLE `player_sanctions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `complex_id` (`complex_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `pricing_rules`
--
ALTER TABLE `pricing_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complex_id` (`complex_id`),
  ADD KEY `terrain_id` (`terrain_id`);

--
-- Index pour la table `promo_codes`
--
ALTER TABLE `promo_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complex_id` (`complex_id`);

--
-- Index pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `terrain_id` (`terrain_id`);

--
-- Index pour la table `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `captain_id` (`captain_id`);

--
-- Index pour la table `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `team_id` (`team_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `terrains`
--
ALTER TABLE `terrains`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complex_id` (`complex_id`);

--
-- Index pour la table `tournaments`
--
ALTER TABLE `tournaments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `tournament_entries`
--
ALTER TABLE `tournament_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `captain_id` (`captain_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `referral_code` (`referral_code`),
  ADD UNIQUE KEY `friend_code` (`friend_code`),
  ADD KEY `referred_by` (`referred_by`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `app_settings`
--
ALTER TABLE `app_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `championships`
--
ALTER TABLE `championships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `complexes`
--
ALTER TABLE `complexes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `friends`
--
ALTER TABLE `friends`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `friend_requests`
--
ALTER TABLE `friend_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `matches`
--
ALTER TABLE `matches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT pour la table `match_invitations`
--
ALTER TABLE `match_invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT pour la table `match_participants`
--
ALTER TABLE `match_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=189;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT pour la table `player_sanctions`
--
ALTER TABLE `player_sanctions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pricing_rules`
--
ALTER TABLE `pricing_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `promo_codes`
--
ALTER TABLE `promo_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=139;

--
-- AUTO_INCREMENT pour la table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `terrains`
--
ALTER TABLE `terrains`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `tournaments`
--
ALTER TABLE `tournaments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `tournament_entries`
--
ALTER TABLE `tournament_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `championships`
--
ALTER TABLE `championships`
  ADD CONSTRAINT `championships_ibfk_1` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`);

--
-- Contraintes pour la table `complexes`
--
ALTER TABLE `complexes`
  ADD CONSTRAINT `complexes_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `friends`
--
ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `friend_requests`
--
ALTER TABLE `friend_requests`
  ADD CONSTRAINT `friend_requests_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `friend_requests_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `matches`
--
ALTER TABLE `matches`
  ADD CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`team_home_id`) REFERENCES `teams` (`id`),
  ADD CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`team_away_id`) REFERENCES `teams` (`id`),
  ADD CONSTRAINT `matches_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`);

--
-- Contraintes pour la table `match_invitations`
--
ALTER TABLE `match_invitations`
  ADD CONSTRAINT `match_invitations_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_invitations_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_invitations_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `match_participants`
--
ALTER TABLE `match_participants`
  ADD CONSTRAINT `match_participants_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_message_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notif_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `player_sanctions`
--
ALTER TABLE `player_sanctions`
  ADD CONSTRAINT `player_sanctions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `player_sanctions_ibfk_2` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`),
  ADD CONSTRAINT `player_sanctions_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `pricing_rules`
--
ALTER TABLE `pricing_rules`
  ADD CONSTRAINT `pricing_rules_ibfk_1` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pricing_rules_ibfk_2` FOREIGN KEY (`terrain_id`) REFERENCES `terrains` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `promo_codes`
--
ALTER TABLE `promo_codes`
  ADD CONSTRAINT `promo_codes_ibfk_1` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`terrain_id`) REFERENCES `terrains` (`id`);

--
-- Contraintes pour la table `teams`
--
ALTER TABLE `teams`
  ADD CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`captain_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `team_members`
--
ALTER TABLE `team_members`
  ADD CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `terrains`
--
ALTER TABLE `terrains`
  ADD CONSTRAINT `terrains_ibfk_1` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `tournaments`
--
ALTER TABLE `tournaments`
  ADD CONSTRAINT `tournaments_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `tournament_entries`
--
ALTER TABLE `tournament_entries`
  ADD CONSTRAINT `tournament_entries_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tournament_entries_ibfk_2` FOREIGN KEY (`captain_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`referred_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
