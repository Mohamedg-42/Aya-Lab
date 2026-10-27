CREATE TABLE `lab_data_snapshot` (
	`id` int NOT NULL,
	`payload` text NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_data_snapshot_id` PRIMARY KEY(`id`)
);
