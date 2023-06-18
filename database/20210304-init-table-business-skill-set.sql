-- Category of each business_skill
CREATE TABLE business_skill_category (
	id serial PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
	description VARCHAR(255),
	sort serial,
	delete_flag BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table business_skill of system
CREATE TABLE business_skill (
	id serial PRIMARY KEY,
	category_id INT REFERENCES business_skill_category(id),
    name VARCHAR(255) UNIQUE NOT NULL,
	description VARCHAR(255),
	delete_flag BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);