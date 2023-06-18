CREATE TABLE time_work_draft(
	internid INT,
	start TIMESTAMP WITH TIME ZONE,
	value INT,
	CONSTRAINT pk_timedraft primary key (internid,start),
	CONSTRAINT fk_timedraft foreign key (internid) references public."user"(id) ON DELETE CASCADE
);
CREATE TABLE time_work(
	internid INT,
	start TIMESTAMP WITH TIME ZONE,
	value INT,
	CONSTRAINT pk_timework primary key (internid,start),
	CONSTRAINT fk_timework foreign key (internid) references public."user"(id) ON DELETE CASCADE
);
CREATE TABLE teams(
	id SERIAL,
	leaderid INT,
	urlslack text,
	CONSTRAINT pk_teams primary key (id),
	CONSTRAINT fk_teams foreign key (leaderid) references public."user"(id) ON DELETE CASCADE
);
CREATE TABLE user_of_team(
	internid INT,
	teamid INT,
	start TIMESTAMP WITH TIME ZONE,
	CONSTRAINT pk_userofteam primary key (internid,teamid),
	CONSTRAINT fk1_userofteam foreign key (internid) references public."user"(id) ON DELETE CASCADE,
	CONSTRAINT fk2_userofteam foreign key (teamid) references public."teams"(id) ON DELETE CASCADE
);
CREATE TABLE salary(
	internid INT,
	updateat TIMESTAMP WITH TIME ZONE,
	salaryaday INT,
	CONSTRAINT pk_salary primary key (internid),
	CONSTRAINT fk_salary foreign key (internid) references public."user"(id) ON DELETE CASCADE
);
CREATE TABLE history_salary(
	internid INT,
	updateat TIMESTAMP WITH TIME ZONE,
	salaryaday INT,
	month text,
	CONSTRAINT pk_historysalary primary key (internid,month),
	CONSTRAINT fk_historysalary foreign key (internid) references public."user"(id) ON DELETE CASCADE
);
ALTER TABLE user_profile ADD COLUMN cv text;
INSERT INTO role (name) VALUES ('intern');

