-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: pragathienterprises
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `pragathienterprises`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `pragathienterprises` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `pragathienterprises`;

--
-- Table structure for table `backorders`
--

DROP TABLE IF EXISTS `backorders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backorders` (
  `id` varchar(50) NOT NULL,
  `shopId` varchar(50) DEFAULT NULL,
  `productId` varchar(50) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `orderDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(50) DEFAULT 'system',
  `updatedBy` varchar(50) DEFAULT 'system',
  PRIMARY KEY (`id`),
  KEY `shopId` (`shopId`),
  KEY `productId` (`productId`),
  CONSTRAINT `backorders_ibfk_1` FOREIGN KEY (`shopId`) REFERENCES `shops` (`id`),
  CONSTRAINT `backorders_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `change_logs`
--

DROP TABLE IF EXISTS `change_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `change_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tableName` varchar(50) NOT NULL,
  `recordId` varchar(50) NOT NULL,
  `action` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `oldData` json DEFAULT NULL,
  `newData` json DEFAULT NULL,
  `changedBy` varchar(50) DEFAULT NULL,
  `changedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `login_logs`
--

DROP TABLE IF EXISTS `login_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` varchar(50) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `loginTime` datetime DEFAULT CURRENT_TIMESTAMP,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` varchar(50) DEFAULT NULL,
  `productId` varchar(50) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `productId` (`productId`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` varchar(50) NOT NULL,
  `shopId` varchar(50) DEFAULT NULL,
  `orderDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) DEFAULT NULL,
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `priority` varchar(50) DEFAULT NULL,
  `village` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(50) DEFAULT 'system',
  `updatedBy` varchar(50) DEFAULT 'system',
  PRIMARY KEY (`id`),
  KEY `shopId` (`shopId`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`shopId`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `hsn` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `imageUrl` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(50) DEFAULT 'system',
  `updatedBy` varchar(50) DEFAULT 'system',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shops`
--

DROP TABLE IF EXISTS `shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shops` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text,
  `village` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `gstin` varchar(50) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(50) DEFAULT 'system',
  `updatedBy` varchar(50) DEFAULT 'system',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_requests`
--

DROP TABLE IF EXISTS `stock_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_requests` (
  `id` varchar(50) NOT NULL,
  `productId` varchar(50) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `requestDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(50) DEFAULT 'system',
  `updatedBy` varchar(50) DEFAULT 'system',
  PRIMARY KEY (`id`),
  KEY `productId` (`productId`),
  CONSTRAINT `stock_requests_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `password` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(50) DEFAULT 'system',
  `updatedBy` varchar(50) DEFAULT 'system',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-01 11:55:02
