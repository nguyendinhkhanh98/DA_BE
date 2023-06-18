CREATE TABLE project (
	id serial PRIMARY KEY,
	name VARCHAR (255) UNIQUE NOT NULL,
	delete_flag BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_project (
	user_id integer NOT NULL REFERENCES "user"(id),
	project_id integer NOT NULL REFERENCES project(id),
	PRIMARY KEY (user_id, project_id)
);