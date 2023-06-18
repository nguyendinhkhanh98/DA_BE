CREATE TABLE "user" (
	id serial PRIMARY KEY,
	username VARCHAR (255) UNIQUE NOT NULL,
	hash_password VARCHAR (255) NOT NULL,
	email VARCHAR (255) UNIQUE NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_profile (
	id integer NOT NULL REFERENCES "user"(id),
	full_name VARCHAR (255),
	address VARCHAR (255),
	phone VARCHAR (255),
	birthday DATE,
	avatar VARCHAR (255),
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	PRIMARY KEY (id)
);

CREATE TABLE role (
	id serial PRIMARY KEY,
	name VARCHAR (255) UNIQUE NOT NULL,
	delete_flg BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_role (
	user_id integer NOT NULL REFERENCES "user"(id),
	role_id integer NOT NULL REFERENCES role(id),
	PRIMARY KEY (user_id, role_id),
	status VARCHAR (255)
);
