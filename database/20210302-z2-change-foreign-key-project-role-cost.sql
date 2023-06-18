TRUNCATE TABLE project_role_cost RESTART IDENTITY;

ALTER TABLE project_role_cost DROP CONSTRAINT project_role_cost_role_id_foreign;

ALTER TABLE project_role_cost 
ADD CONSTRAINT project_role_cost_role_id_foreign 
FOREIGN KEY (role_id) 
REFERENCES role_project (id);