-- Change description vn from asset to asset_type
ALTER TABLE asset DROP COLUMN asset_info_vn;
ALTER TABLE asset_type ADD COLUMN description VARCHAR(255);

-- Drop CONSTRAINT NOT NULL table asset
ALTER TABLE asset ALTER COLUMN asset_code DROP NOT NULL;
ALTER TABLE asset ALTER COLUMN asset_info DROP NOT NULL;
ALTER TABLE asset ALTER COLUMN note DROP NOT NULL;
ALTER TABLE asset ALTER COLUMN status DROP NOT NULL;

-- Drop CONSTRAINT NOT NULL table asset_type
ALTER TABLE asset_type ALTER COLUMN asset_type_code DROP NOT NULL;
ALTER TABLE asset_type ALTER COLUMN asset_type_name DROP NOT NULL;
ALTER TABLE asset_type ALTER COLUMN description DROP NOT NULL;
