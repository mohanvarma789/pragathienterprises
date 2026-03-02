CREATE USER IF NOT EXISTS 'pragathi_user'@'localhost' IDENTIFIED BY 'Pragathi@2024';
ALTER USER 'pragathi_user'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('Pragathi@2024');
GRANT ALL PRIVILEGES ON pragathienterprises.* TO 'pragathi_user'@'localhost';
FLUSH PRIVILEGES;
