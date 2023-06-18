CREATE TABLE project_role_cost (
	id serial,
	role_id integer NOT NULL REFERENCES role(id),
	project_id integer NOT NULL REFERENCES project(id),
	cost real,
	PRIMARY KEY (role_id, project_id)
);