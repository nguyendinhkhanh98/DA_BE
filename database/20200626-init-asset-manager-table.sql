-- ------------------------------- Create table for company pattern ---------------------------
CREATE TABLE company(
    id serial PRIMARY KEY,
    code VARCHAR (255) UNIQUE NOT NULL,
    name VARCHAR (255) NOT NULL
);

-- ------------------------------- Create table for purpose ---------------------------
CREATE TABLE purpose(
    id serial PRIMARY KEY,
    name VARCHAR (255) NOT NULL
);

-- ------------------------------- Create table contain infomation each asset ---------------------------

CREATE TABLE asset(
    id serial PRIMARY KEY,
    asset_code VARCHAR (255) NOT NULL,
    asset_type_id INT NOT NULL,
    created_id INT NOT NULL,
    asset_info VARCHAR (255) NOT NULL,
    asset_info_vn VARCHAR (255) NOT NULL,
    purpose_id INT NOT NULL,
    status VARCHAR (255) NOT NULL,
    manager_id INT NOT NULL DEFAULT -1,
    note VARCHAR (255) NOT NULL,
    company_id INT NOT NULL,
    qr_code TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- ------------------------------- Create table manager each asset ---------------------------

CREATE TABLE asset_type(
    id serial PRIMARY KEY,
    asset_type_code VARCHAR (255) NOT NULL,
    asset_type_name VARCHAR (255) NOT NULL,
    created_id INT NOT NULL,
    count INT NOT NULL DEFAULT 0,
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
