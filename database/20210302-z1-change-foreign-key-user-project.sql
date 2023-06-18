ALTER TABLE user_project DROP CONSTRAINT user_project_pkey;

ALTER TABLE user_project ADD COLUMN id serial PRIMARY KEY;
ALTER TABLE user_project ADD COLUMN role_project_id integer REFERENCES role_project(id);
