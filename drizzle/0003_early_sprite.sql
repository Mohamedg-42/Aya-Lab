CREATE TABLE `lab_session` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lab_session_id` PRIMARY KEY(`id`),
	CONSTRAINT `lab_session_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `lab_session` ADD CONSTRAINT `lab_session_user_id_lab_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `lab_user`(`id`) ON DELETE no action ON UPDATE no action;