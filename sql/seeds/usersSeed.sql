INSERT INTO users (first_name, last_name, email, password, google_id, google_token, default_address, created_at)
VALUES
  ('John', 'Doe', 'john.doe@example.com', '$2b$10$7tmiVXKRimYEwQd9PQo/rOB2Kol/K.5fTAqoWIZlDFWZocHoSgFHC', NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('Jane', 'Smith', 'jane.smith@example.com', '$2b$10$7tmiVXKRimYEwQd9PQo/rOB2Kol/K.5fTAqoWIZlDFWZocHoSgFHC', NULL, NULL, NULL, CURRENT_TIMESTAMP),
  ('Alice', 'Johnson', 'alice.johnson@example.com', '$2b$10$7tmiVXKRimYEwQd9PQo/rOB2Kol/K.5fTAqoWIZlDFWZocHoSgFHC', 'google_id_1', 'google_token_1', NULL, CURRENT_TIMESTAMP),
  ('Bob', 'Williams', 'bob.williams@example.com', '$2b$10$7tmiVXKRimYEwQd9PQo/rOB2Kol/K.5fTAqoWIZlDFWZocHoSgFHC', 'google_id_2', 'google_token_2', NULL, CURRENT_TIMESTAMP);

INSERT INTO shipping_addresses (user_id, recipient_name, street_address, city, state_province, postal_code, country, phone_number, notes, created_at)
VALUES
  (1, 'John Doe', '123 Main St', 'New York', 'NY', '10001', 'eu', '123-456-7890', 'Note 1', CURRENT_TIMESTAMP),
  (2, 'Jane Smith', '456 Elm St', 'Los Angeles', 'CA', '90001', 'eu', '987-654-3210', 'Note 2', CURRENT_TIMESTAMP),
  (3, 'Alice Johnson', '789 Oak St', 'London', 'LN', 'EC1A 1BB', 'uk', '44-20-1234-5678', NULL, CURRENT_TIMESTAMP),
  (4, 'Bob Williams', '101 Maple St', 'Rome', 'RM', '00118', 'it', '+39 06 1234 5678', NULL, CURRENT_TIMESTAMP);

-- Update the default_address of created users
UPDATE users
SET default_address = sa.id
FROM shipping_addresses sa
WHERE CONCAT(users.first_name, ' ', users.last_name) = sa.recipient_name;

-- Set John Doe as admin
WITH user_id_cte AS (
  SELECT u.id FROM users u WHERE u.email = 'john.doe@example.com'
)
INSERT INTO admins
SELECT id FROM user_id_cte;