CREATE TABLE task_status (
	id serial PRIMARY KEY,
	name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE task (
	id serial PRIMARY KEY,
	name VARCHAR(255) UNIQUE NOT NULL,
	description VARCHAR(255),
	status_id INT REFERENCES task_status(id),
	delete_flag BOOLEAN NOT NULL DEFAULT FALSE,
	started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE task_skill (
	id serial PRIMARY KEY,
	task_id INT REFERENCES task(id),
	skill_id INT REFERENCES skill(id)
);

CREATE TABLE task_business_skill (
	id serial PRIMARY KEY,
	task_id INT REFERENCES task(id),
	business_skill_id INT REFERENCES business_skill(id)
);

INSERT INTO task_status (name) VALUES ('active'),('inactive');