-- Table level
CREATE TABLE levels (
	id serial PRIMARY KEY,
	level INT,
	type VARCHAR(255),
	name VARCHAR(255) UNIQUE,
	description text,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table period
CREATE TABLE period (
	id serial PRIMARY KEY,
	name VARCHAR(255) UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
	description VARCHAR(255),
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Contain user and period match
CREATE TABLE user_period (
	id serial PRIMARY KEY,
	period_id INT REFERENCES period(id) NOT NULL,
	user_id INT REFERENCES "user"(id) NOT NULL,
	leader_id INT REFERENCES "user"(id) NOT NULL,
	status VARCHAR(255),
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Category of each skill
CREATE TABLE skill_category (
	id serial PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
	description VARCHAR(255),
	sort serial,
	delete_flag BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table skill of system
CREATE TABLE skill (
	id serial PRIMARY KEY,
	category_id INT REFERENCES skill_category(id),
    name VARCHAR(255) UNIQUE NOT NULL,
	description VARCHAR(255),
	delete_flag BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Skill set of employee in company
CREATE TABLE skill_set (
	id serial PRIMARY KEY,
	user_period_id INT REFERENCES user_period(id) NOT NULL,
    skill_id INT REFERENCES skill(id) NOT NULL,
    experience_time INT,
    level INT,
    level_review INT,
    note VARCHAR(255),
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	UNIQUE (user_period_id, skill_id)
);