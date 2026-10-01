CREATE DATABASE IF NOT EXISTS contacts_db;
USE contacts_db;

CREATE TABLE IF NOT EXISTS contacts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(40) NOT NULL,
    email_address VARCHAR(254) NULL,
    category ENUM('friend', 'family', 'school') NOT NULL
);