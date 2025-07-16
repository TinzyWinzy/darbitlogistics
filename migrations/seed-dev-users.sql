-- Seed development users with real bcrypt hashes
INSERT INTO users (username, password, role) VALUES
  ('hanzo',    '$2b$10$sGuT6OEnGQKo1lz3qN7OiO0DDSPJpd5/T8kQrKg8Hpy0YmFesICDq', 'admin'), -- hanzo1234#
  ('operator1','$2b$10$I0assa8hdhUBkGE/P7QNO.Ay6zQYXdB.2wG7PHZl.EcHqulEuGZn6', 'operator'), -- password1234
  ('operator2','$2b$10$vBWMCj86Mhl/XokbIngnvOZrM6ROHnFPP1leB6KmlgsJJ/YlW.AcS', 'operator'), -- pass1234
  ('operator3','$2b$10$kixhFOYDulRw4nniejhvLOWcwnfBIV3MCHKPASRkhf/3n/e6Dhjuy', 'operator'), -- operator12
  ('innocent', '$2b$10$w8QwQn6QwQn6QwQn6QwQnOQwQn6QwQn6QwQn6QwQn6QwQn6QwQn6', 'operator') -- inno2025
ON CONFLICT (username) DO NOTHING;
-- Replace the above hashes with actual bcrypt hashes for the real passwords. 