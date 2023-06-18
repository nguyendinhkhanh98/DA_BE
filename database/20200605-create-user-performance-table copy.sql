CREATE TABLE user_performance (
    id serial PRIMARY KEY,
	user_id integer NOT NULL REFERENCES "user"(id),
	work_date DATE,
	sprint VARCHAR (255),
    cpi numeric,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);