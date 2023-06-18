CREATE TABLE invoice_status (
	id serial PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE invoice_project (
	id serial PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    project_id integer NOT NULL REFERENCES project(id),
    user_created integer NOT NULL REFERENCES "user"(id),
    cost real,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE invoice_history (
	id serial PRIMARY KEY,
    invoice_id integer NOT NULL REFERENCES invoice_project(id),
    status_id integer NOT NULL REFERENCES invoice_status(id),

    start_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO invoice_status (name) VALUES ('PLAN'), ('INVOICE issued'), ('Acceptance'), ('Money Transfer'), ('Payment Confirmed');
