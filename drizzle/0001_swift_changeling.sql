CREATE TABLE `debateMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debateId` int NOT NULL,
	`roundNumber` int NOT NULL,
	`agentName` varchar(100) NOT NULL,
	`agentPersona` varchar(255),
	`messageType` enum('initial_response','critique','refined_response') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `debateMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debateMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debateId` int NOT NULL,
	`convergenceSpeed` decimal(5,2),
	`agentAgreementRate` decimal(5,2),
	`qualityImprovement` decimal(5,2),
	`averageResponseLength` int,
	`debateComplexity` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `debateMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debateRounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debateId` int NOT NULL,
	`roundNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `debateRounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debateSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultNumberOfRounds` int NOT NULL DEFAULT 2,
	`enableEmailNotifications` boolean NOT NULL DEFAULT true,
	`agentPersonas` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debateSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inquiry` text NOT NULL,
	`topic` varchar(255),
	`numberOfRounds` int NOT NULL DEFAULT 2,
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`finalSynthesis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `debates_id` PRIMARY KEY(`id`)
);
