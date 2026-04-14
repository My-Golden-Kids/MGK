-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (arm64)
--
-- Host: 127.0.0.1    Database: bemgkdb
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_books`
--

DROP TABLE IF EXISTS `account_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_books` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `amount` decimal(19,2) NOT NULL,
  `category` enum('Etc','Food','Hospital') COLLATE utf8mb4_unicode_ci NOT NULL,
  `memo` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spend_date` datetime(6) NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `pet_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcropc6xbu5pwqp0j0k1g2yb7v` (`account_id`),
  KEY `FKk6js6xb1g2kmleuabxudd6hj7` (`user_id`),
  KEY `FKkdhl644qunlape3dmh3cbrhcf` (`pet_id`),
  CONSTRAINT `FKcropc6xbu5pwqp0j0k1g2yb7v` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `FKk6js6xb1g2kmleuabxudd6hj7` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKkdhl644qunlape3dmh3cbrhcf` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_books`
--

LOCK TABLES `account_books` WRITE;
/*!40000 ALTER TABLE `account_books` DISABLE KEYS */;
INSERT INTO `account_books` VALUES (1,'2026-04-14 13:37:15.337478','2026-04-14 13:37:15.337478',0.00,'Etc',NULL,'2026-04-14 13:37:15.334714','첫 계좌연결',1,3,NULL);
/*!40000 ALTER TABLE `account_books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `money_amount` decimal(19,2) NOT NULL,
  `reward_amount` decimal(19,2) NOT NULL,
  `total_amount` decimal(19,2) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6kplolsdtr3slnvx97xsy2kc8` (`account_number`),
  KEY `FKnjuop33mo69pd79ctplkck40n` (`user_id`),
  CONSTRAINT `FKnjuop33mo69pd79ctplkck40n` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'2026-04-14 13:37:15.309200','2026-04-14 13:37:15.309200','35131531355135135','HanaBank',1000000.00,0.00,10000000.00,3);
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendars`
--

DROP TABLE IF EXISTS `calendars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendars` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `date` date NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `memo` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pet_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK41f0d0wc04fd4h1a0h6j54uom` (`pet_id`),
  CONSTRAINT `FK41f0d0wc04fd4h1a0h6j54uom` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendars`
--

LOCK TABLES `calendars` WRITE;
/*!40000 ALTER TABLE `calendars` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maps`
--

DROP TABLE IF EXISTS `maps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maps`
--

LOCK TABLES `maps` WRITE;
/*!40000 ALTER TABLE `maps` DISABLE KEYS */;
/*!40000 ALTER TABLE `maps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_documents`
--

DROP TABLE IF EXISTS `medical_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `date` date NOT NULL,
  `hospital_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('CHECKUP','ETC','VACCINATION') COLLATE utf8mb4_unicode_ci NOT NULL,
  `pet_id` bigint NOT NULL,
  `details` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pet_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbnu5lcq3fyyeynlxtylwfrxxb` (`pet_id`),
  CONSTRAINT `FKbnu5lcq3fyyeynlxtylwfrxxb` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_documents`
--

LOCK TABLES `medical_documents` WRITE;
/*!40000 ALTER TABLE `medical_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pet_walk_records`
--

DROP TABLE IF EXISTS `pet_walk_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pet_walk_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `completed` bit(1) DEFAULT NULL,
  `distance_km` double NOT NULL,
  `ended_at` datetime(6) DEFAULT NULL,
  `reward_amount` int NOT NULL,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `step_count` int NOT NULL,
  `walk_time_seconds` int NOT NULL,
  `walked_at` datetime(6) NOT NULL,
  `pet_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pet_walk_record_pet_source` (`pet_id`,`source`),
  CONSTRAINT `FK9lhfpwh2e9qkgkjskupm22mb` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pet_walk_records`
--

LOCK TABLES `pet_walk_records` WRITE;
/*!40000 ALTER TABLE `pet_walk_records` DISABLE KEYS */;
INSERT INTO `pet_walk_records` VALUES (1,'2026-04-13 10:05:00.000000','2026-04-13 10:35:00.000000',_binary '',3.2,'2026-04-13 10:35:00.000000',1,'SEED_20260413_1000','2026-04-13 10:05:00.000000','COMPLETED',4500,1800,'2026-04-13 10:05:00.000000',1),(2,'2026-04-12 10:10:00.000000','2026-04-12 10:36:00.000000',_binary '',2.8,'2026-04-12 10:36:00.000000',1,'SEED_20260412_1000','2026-04-12 10:10:00.000000','COMPLETED',3900,1560,'2026-04-12 10:10:00.000000',1),(3,'2026-04-11 10:20:00.000000','2026-04-11 10:54:00.000000',_binary '',3.7,'2026-04-11 10:54:00.000000',1,'SEED_20260411_1000','2026-04-11 10:20:00.000000','COMPLETED',5100,2040,'2026-04-11 10:20:00.000000',1),(4,'2026-04-10 10:00:00.000000','2026-04-10 10:28:00.000000',_binary '',3,'2026-04-10 10:28:00.000000',1,'SEED_20260410_1000','2026-04-10 10:00:00.000000','COMPLETED',4200,1680,'2026-04-10 10:00:00.000000',1),(5,'2026-04-09 10:45:00.000000','2026-04-09 11:09:00.000000',_binary '',2.6,'2026-04-09 11:09:00.000000',1,'SEED_20260409_1000','2026-04-09 10:45:00.000000','COMPLETED',3600,1440,'2026-04-09 10:45:00.000000',1),(6,'2026-04-08 07:15:00.000000','2026-04-08 07:35:00.000000',_binary '',2.1,'2026-04-08 07:35:00.000000',1,'SEED_20260408_0700','2026-04-08 07:15:00.000000','COMPLETED',3000,1200,'2026-04-08 07:15:00.000000',1),(7,'2026-04-07 07:30:00.000000','2026-04-07 07:48:00.000000',_binary '',1.9,'2026-04-07 07:48:00.000000',0,'SEED_20260407_0700','2026-04-07 07:30:00.000000','COMPLETED',2700,1080,'2026-04-07 07:30:00.000000',1),(8,'2026-04-06 15:00:00.000000','2026-04-06 15:40:00.000000',_binary '',4.3,'2026-04-06 15:40:00.000000',2,'SEED_20260406_1500','2026-04-06 15:00:00.000000','COMPLETED',6000,2400,'2026-04-06 15:00:00.000000',1);
/*!40000 ALTER TABLE `pet_walk_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pets`
--

DROP TABLE IF EXISTS `pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `age` double DEFAULT NULL,
  `eat_meal` enum('NO','YES') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_walk_at` datetime(6) DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` enum('대형','소형','중형') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `species` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `walk_count` int DEFAULT NULL,
  `walk_time` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `death` bit(1) DEFAULT NULL,
  `death_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKc47kjb41qf50bwgddm024m5xn` (`user_id`),
  CONSTRAINT `FKc47kjb41qf50bwgddm024m5xn` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pets`
--

LOCK TABLES `pets` WRITE;
/*!40000 ALTER TABLE `pets` DISABLE KEYS */;
INSERT INTO `pets` VALUES (1,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',3,'NO','/images/pet/dolmeng1.jpeg',NULL,'돌','소형','강아지',0,0,1,NULL,NULL),(2,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',4,'NO','/images/pet/dolmeng2.jpeg',NULL,'멩','소형','강아지',0,0,1,NULL,NULL),(3,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',2,'NO','/images/pet/dolmeng3.jpeg',NULL,'이','소형','강아지',0,0,1,NULL,NULL),(4,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',5,'NO','/images/pet/dolmeng1.jpeg',NULL,'돌멩이이','중형','강아지',0,0,2,NULL,NULL);
/*!40000 ALTER TABLE `pets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `benefit_amount` decimal(19,2) DEFAULT NULL,
  `benefit_limit_amount` decimal(19,2) DEFAULT NULL,
  `benefit_limit_count` int DEFAULT NULL,
  `benefit_period` enum('MONTH','YEAR') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `benefit_rate` decimal(10,2) DEFAULT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_type` enum('CARD','INSURANCE','SAVINGS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_type` enum('ACCOUNT','ACCOUNT_BOOK') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',100000.00,NULL,20,'YEAR',NULL,'반려동물 의료비 보장을 제공하는 보험 상품',_binary '','하나 펫사랑보험','INSURANCE','ACCOUNT_BOOK','병원','https://www.hanabank.com'),(2,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',NULL,40000.00,NULL,'MONTH',10.00,'병원 및 쇼핑 혜택을 제공하는 카드 상품',_binary '','하나 펫카드','CARD','ACCOUNT_BOOK','병원,쇼핑','https://www.hanacard.co.kr'),(3,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',NULL,NULL,NULL,NULL,2.80,'반려동물을 위한 적금 상품',_binary '','하나 펫적금','SAVINGS','ACCOUNT',NULL,'https://www.hanabank.com');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `token` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1lih5y2npsf8u5o3vhdb9y0os` (`user_id`),
  CONSTRAINT `FK1lih5y2npsf8u5o3vhdb9y0os` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (10,'2026-04-13 17:57:22.250699','2026-04-20 17:57:22.000000','eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0IiwiaWF0IjoxNzc2MDcwNjQyLCJleHAiOjE3NzY2NzU0NDJ9.yiLZnkeVy0qHzGQVctfjTMV_gKZXsiVFRl1Zf8YF6wU',4),(13,'2026-04-14 13:37:15.977510','2026-04-21 13:37:15.000000','eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzIiwiaWF0IjoxNzc2MTQxNDM1LCJleHAiOjE3NzY3NDYyMzV9.ku24O1nLqtQZ6-ROyibINfEwU6sJaKvJJnUIFHFDM14',3);
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `amount` decimal(19,2) NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('IN','OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` bigint NOT NULL,
  `receive_user_id` bigint DEFAULT NULL,
  `send_user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK20w7wsg13u9srbq3bd7chfxdh` (`account_id`),
  KEY `FKb6d6g80479txle1kxpwf8xv5r` (`receive_user_id`),
  KEY `FKfrr0oxv5clk4b3w8jvf1bl0f` (`send_user_id`),
  CONSTRAINT `FK20w7wsg13u9srbq3bd7chfxdh` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `FKb6d6g80479txle1kxpwf8xv5r` FOREIGN KEY (`receive_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKfrr0oxv5clk4b3w8jvf1bl0f` FOREIGN KEY (`send_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` datetime(6) DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',NULL,'th2gr22n@gmail.com',NULL,'정그린','$2a$10$yTtoIV74eLKVOpsvCAxQy.LD4/m2EUD4VWoiYn3zTkqg0eAE281XK'),(2,'2026-04-14 13:35:55.000000','2026-04-14 13:35:55.000000',NULL,'yjjeon08@gmail.com',NULL,'전유진','$2a$10$yTtoIV74eLKVOpsvCAxQy.LD4/m2EUD4VWoiYn3zTkqg0eAE281XK'),(3,'2026-04-14 13:37:15.253007','2026-04-14 13:37:15.253007',NULL,'tjddnjs612@gmail.com',NULL,'김돌멩','$2a$10$4Hk4er2V6On.uj82leQyUuEMrGYc6zhkw7xfj4mCCkO6lw2vEJcNu');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verifications`
--

DROP TABLE IF EXISTS `verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `identifier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdr2ibpdjbtdj343h2ku3tyw2v` (`user_id`),
  CONSTRAINT `FKdr2ibpdjbtdj343h2ku3tyw2v` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verifications`
--

LOCK TABLES `verifications` WRITE;
/*!40000 ALTER TABLE `verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `verifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-14 16:51:41
