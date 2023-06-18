CREATE TABLE time_off_work_history (
	id serial PRIMARY KEY,
	user_id integer NOT NULL REFERENCES "user"(id),
	type VARCHAR (255),
	manager_id integer NOT NULL REFERENCES "user"(id),
	date_created DATE NOT NULL DEFAULT CURRENT_DATE,
	reason text,
	data json,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	status VARCHAR (255),

	UNIQUE (user_id, date_created, type)
);