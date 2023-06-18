CREATE TABLE business_levels (
	id serial PRIMARY KEY,
    level serial,
    name VARCHAR(255) UNIQUE,
    description text,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE business_user_period (
	id serial PRIMARY KEY,
    period_id integer NOT NULL REFERENCES period(id),
    user_id integer NOT NULL REFERENCES "user"(id),
    leader_id integer NOT NULL REFERENCES "user"(id),
    status VARCHAR(255) UNIQUE NOT NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE business_skill_set (
	id serial PRIMARY KEY,
    user_period_id integer NOT NULL REFERENCES business_user_period(id),
    business_skill_id integer NOT NULL REFERENCES business_skill(id),
    experience_time integer,
    level integer,
    level_review integer,
    note VARCHAR(255),
    UNIQUE (user_period_id, business_skill_id),

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO business_levels (name, description) VALUES 
('L0', 'No knowledge or no experience'), 
('L1', 'Has knowledge'), 
('L2', 'Can be done with support, or has experience'), 
('L3', 'Can be done on your own or has experience'), 
('L4', 'Can or has experience in teaching others');
