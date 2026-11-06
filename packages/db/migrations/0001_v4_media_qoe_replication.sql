ALTER TABLE "delivery_events" ADD COLUMN "startup_latency_ms" integer;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD COLUMN "rebuffer_duration_ms" integer;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD COLUMN "rendition_profile" text;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD COLUMN "region_code" text;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD COLUMN "error_code" text;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD COLUMN "correlation_id" text;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD COLUMN "occurred_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "delivery_events_type_occurred_idx" ON "delivery_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "delivery_events_occurred_idx" ON "delivery_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE TABLE "replication_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"storage_object_id" text NOT NULL,
	"target_provider" text NOT NULL,
	"target_region" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"expected_sha256" text NOT NULL,
	"checksum_verified_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drm_configurations" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"drm_system" text NOT NULL,
	"provider_config_ref" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "replication_tasks" ADD CONSTRAINT "replication_tasks_storage_object_id_media_objects_id_fk" FOREIGN KEY ("storage_object_id") REFERENCES "public"."media_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "replication_tasks_object_idx" ON "replication_tasks" USING btree ("storage_object_id");--> statement-breakpoint
CREATE INDEX "replication_tasks_status_idx" ON "replication_tasks" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "replication_tasks_provider_region_idx" ON "replication_tasks" USING btree ("target_provider","target_region");--> statement-breakpoint
CREATE INDEX "drm_configurations_provider_system_idx" ON "drm_configurations" USING btree ("provider","drm_system","is_active");
