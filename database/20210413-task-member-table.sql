CREATE TABLE user_task_history (
	id SERIAL PRIMARY KEY,
	task_id INT NOT NULL,
	user_id INT NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	CONSTRAINT fk_userid foreign key (user_id) references public."user"(id),
	CONSTRAINT fk_taskid foreign key (task_id) references public."task"(id),
	UNIQUE(task_id, user_id, start_date)
);
