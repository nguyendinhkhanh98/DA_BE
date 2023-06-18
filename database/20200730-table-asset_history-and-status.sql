CREATE TABLE status (
	id serial PRIMARY KEY,
	name VARCHAR(255) UNIQUE
);

CREATE TABLE asset_history (
	id serial PRIMARY KEY,
	asset_id INT,
	user_change_id INT,
	type VARCHAR(255),
	comment VARCHAR(255),
	status_before VARCHAR (255),
	status_after VARCHAR (255),
	manager_id_before VARCHAR (255),
	manager_id_after VARCHAR (255),
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);