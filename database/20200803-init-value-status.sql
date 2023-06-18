   
-- ------------------------------- Insert and fixed value for status table ---------------------------
INSERT INTO status (id, name) VALUES 
    (1, 'InStock'),
    (2, 'Using'),
    (3, 'Wait for confirm'),
    (4, 'In use'),
    (5, '__create__'),
    (6, '__delete__')
ALTER TABLE asset ADD COLUMN status_id INT DEFAULT 1;
ALTER TABLE asset_history ADD COLUMN status_id_before INT;
ALTER TABLE asset_history ADD COLUMN status_id_after INT;
