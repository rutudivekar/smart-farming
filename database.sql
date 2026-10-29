CREATE DATABASE IF NOT EXISTS smart_farming;
USE smart_farming;

CREATE TABLE IF NOT EXISTS crops (
    crop_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    season VARCHAR(100),
    soil_type VARCHAR(150),
    growing_period VARCHAR(100),
    farming_guidance TEXT
);

CREATE TABLE IF NOT EXISTS market_prices (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    market_name VARCHAR(150) NOT NULL,
    price_per_quintal DECIMAL(10,2),
    price_date DATE
);

INSERT INTO crops (crop_name, season, soil_type, growing_period, farming_guidance)
VALUES
('Wheat', 'Rabi', 'Well-drained loamy soil', 'Approx. 110–140 days', 'Verify variety and input advice with local agricultural experts'),
('Rice', 'Kharif', 'Clayey or loamy soil', 'Varies by variety', 'Follow local water-management guidance'),
('Tomato', 'Region dependent', 'Well-drained fertile soil', 'Varies by variety', 'Monitor for pests and consult local experts');
