CREATE TABLE `type_analyse` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nom` varchar(180) NOT NULL,
	`discipline` enum('Hématologie','Biochimie','Parasitologie','Immunologie') NOT NULL,
	`delai_indicatif` varchar(40),
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `type_analyse_id` PRIMARY KEY(`id`),
	CONSTRAINT `type_analyse_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `bulletin_type_analyse` (
	`bulletin_id` int NOT NULL,
	`type_analyse_id` int NOT NULL,
	CONSTRAINT `bulletin_type_analyse_bulletin_id_type_analyse_id_pk` PRIMARY KEY(`bulletin_id`,`type_analyse_id`)
);
--> statement-breakpoint
CREATE TABLE `bulletin_analyse` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero_ticket` varchar(40) NOT NULL,
	`patient_id` int NOT NULL,
	`prescripteur_id` int NOT NULL,
	`motif` text NOT NULL,
	`statut` enum('Enregistré','Prélevé','En analyse','Résultats saisis','Remis') NOT NULL DEFAULT 'Enregistré',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`preleve_at` timestamp,
	`resultats_at` timestamp,
	`remis_at` timestamp,
	CONSTRAINT `bulletin_analyse_id` PRIMARY KEY(`id`),
	CONSTRAINT `bulletin_ticket_unique` UNIQUE(`numero_ticket`)
);
--> statement-breakpoint
CREATE TABLE `lab_user` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(80) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('accueil','auxiliaire','technicien','responsable') NOT NULL,
	`display_name` varchar(160) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_user_id` PRIMARY KEY(`id`),
	CONSTRAINT `lab_user_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `parametre_produit` (
	`parametre_id` int NOT NULL,
	`produit_id` int NOT NULL,
	`quantite_par_usage` double NOT NULL DEFAULT 1,
	CONSTRAINT `parametre_produit_parametre_id_produit_id_pk` PRIMARY KEY(`parametre_id`,`produit_id`)
);
--> statement-breakpoint
CREATE TABLE `parametre` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type_analyse_id` int NOT NULL,
	`code` varchar(48) NOT NULL,
	`nom` varchar(160) NOT NULL,
	`unite` varchar(48) NOT NULL,
	`reference_min` double NOT NULL,
	`reference_max` double NOT NULL,
	`ordre` int NOT NULL DEFAULT 0,
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `parametre_id` PRIMARY KEY(`id`),
	CONSTRAINT `parametre_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `patient` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nom` varchar(100) NOT NULL,
	`prenoms` varchar(140) NOT NULL,
	`sexe` enum('F','M') NOT NULL,
	`date_naissance` varchar(10),
	`telephone` varchar(40),
	`type_patient` enum('Externe','Hospitalisé') NOT NULL,
	`numero_dossier` varchar(50),
	`numero_lit` varchar(24),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_id` PRIMARY KEY(`id`),
	CONSTRAINT `patient_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `prescripteur` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(100) NOT NULL,
	`prenoms` varchar(140) NOT NULL,
	`specialite` varchar(140) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prescripteur_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `produit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nom` varchar(180) NOT NULL,
	`lot` varchar(80) NOT NULL,
	`quantite` double NOT NULL DEFAULT 0,
	`unite` varchar(32) NOT NULL,
	`seuil_alerte` double NOT NULL DEFAULT 0,
	`date_ouverture` varchar(10),
	`date_peremption` varchar(10) NOT NULL,
	`fournisseur` varchar(160),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produit_id` PRIMARY KEY(`id`),
	CONSTRAINT `produit_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `resultat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bulletin_id` int NOT NULL,
	`parametre_id` int NOT NULL,
	`technicien_id` int NOT NULL,
	`valeur_mesuree` double NOT NULL,
	`unite` varchar(48) NOT NULL,
	`reference_min` double NOT NULL,
	`reference_max` double NOT NULL,
	`interpretation` enum('Normal','Inférieur','Supérieur') NOT NULL,
	`saisi_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resultat_id` PRIMARY KEY(`id`),
	CONSTRAINT `resultat_bulletin_parametre_unique` UNIQUE(`bulletin_id`,`parametre_id`)
);
--> statement-breakpoint
CREATE TABLE `technicien` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(100) NOT NULL,
	`prenoms` varchar(140) NOT NULL,
	`grade` varchar(120) NOT NULL,
	`user_id` int,
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `technicien_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bulletin_type_analyse` ADD CONSTRAINT `bulletin_type_analyse_bulletin_id_bulletin_analyse_id_fk` FOREIGN KEY (`bulletin_id`) REFERENCES `bulletin_analyse`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulletin_type_analyse` ADD CONSTRAINT `bulletin_type_analyse_type_analyse_id_type_analyse_id_fk` FOREIGN KEY (`type_analyse_id`) REFERENCES `type_analyse`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulletin_analyse` ADD CONSTRAINT `bulletin_analyse_patient_id_patient_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulletin_analyse` ADD CONSTRAINT `bulletin_analyse_prescripteur_id_prescripteur_id_fk` FOREIGN KEY (`prescripteur_id`) REFERENCES `prescripteur`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parametre_produit` ADD CONSTRAINT `parametre_produit_parametre_id_parametre_id_fk` FOREIGN KEY (`parametre_id`) REFERENCES `parametre`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parametre_produit` ADD CONSTRAINT `parametre_produit_produit_id_produit_id_fk` FOREIGN KEY (`produit_id`) REFERENCES `produit`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parametre` ADD CONSTRAINT `parametre_type_analyse_id_type_analyse_id_fk` FOREIGN KEY (`type_analyse_id`) REFERENCES `type_analyse`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultat` ADD CONSTRAINT `resultat_bulletin_id_bulletin_analyse_id_fk` FOREIGN KEY (`bulletin_id`) REFERENCES `bulletin_analyse`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultat` ADD CONSTRAINT `resultat_parametre_id_parametre_id_fk` FOREIGN KEY (`parametre_id`) REFERENCES `parametre`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resultat` ADD CONSTRAINT `resultat_technicien_id_technicien_id_fk` FOREIGN KEY (`technicien_id`) REFERENCES `technicien`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `technicien` ADD CONSTRAINT `technicien_user_id_lab_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `lab_user`(`id`) ON DELETE no action ON UPDATE no action;