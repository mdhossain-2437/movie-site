// Auto-generated embedded migrations for serverless / edge environments where filesystem journal is unavailable.
export const EMBEDDED_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS "collection_items" (
	"collection_id" text NOT NULL,
	"title_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "collection_items_collection_id_title_id_pk" PRIMARY KEY("collection_id","title_id")
);

CREATE TABLE IF NOT EXISTS "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title_en" text NOT NULL,
	"title_bn" text,
	"description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "genres" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text
);

CREATE TABLE IF NOT EXISTS "metadata_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text,
	"attribution_text" text NOT NULL,
	"license_confirmed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "people" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "title_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"person_id" text NOT NULL,
	"department" text NOT NULL,
	"character_name" text,
	"billing_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "title_genres" (
	"title_id" text NOT NULL,
	"genre_id" text NOT NULL,
	CONSTRAINT "title_genres_title_id_genre_id_pk" PRIMARY KEY("title_id","genre_id")
);

CREATE TABLE IF NOT EXISTS "title_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"locale" text NOT NULL,
	"localized_title" text NOT NULL,
	"tagline" text,
	"synopsis" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "titles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"kind" text DEFAULT 'MOVIE' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"original_title" text NOT NULL,
	"original_language" text DEFAULT 'en' NOT NULL,
	"release_year" integer NOT NULL,
	"runtime_minutes" integer NOT NULL,
	"maturity_rating" text DEFAULT 'UNRATED' NOT NULL,
	"legal_hold" boolean DEFAULT false NOT NULL,
	"is_development_fixture" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "watchlist_items" (
	"user_id" text NOT NULL,
	"title_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watchlist_items_user_id_title_id_pk" PRIMARY KEY("user_id","title_id")
);

CREATE TABLE IF NOT EXISTS "mfa_factors" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'TOTP' NOT NULL,
	"secret_base32" text NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"mfa_verified_at" timestamp with time zone,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"granted_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"entitlement_tier" text DEFAULT 'FREE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "media_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"kind" text DEFAULT 'FEATURE' NOT NULL,
	"lifecycle_state" text DEFAULT 'DRAFT' NOT NULL,
	"drm_required" boolean DEFAULT false NOT NULL,
	"container_format" text,
	"duration_seconds" integer,
	"sha256_checksum" text,
	"checksum_verified" boolean DEFAULT false NOT NULL,
	"qc_passed" boolean DEFAULT false NOT NULL,
	"qc_approved_by_user_id" text,
	"qc_approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "media_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"provider" text NOT NULL,
	"bucket" text NOT NULL,
	"object_key" text NOT NULL,
	"byte_length" bigint NOT NULL,
	"sha256_checksum" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "media_renditions" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"resolution" text NOT NULL,
	"codec" text NOT NULL,
	"bitrate_kbps" integer NOT NULL,
	"manifest_object_key" text NOT NULL,
	"has_configured_drm" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "outbox_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"job_type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"leased_until" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subtitle_tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"language_code" text NOT NULL,
	"label" text NOT NULL,
	"object_key" text NOT NULL,
	"is_forced" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"request_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "delivery_events" (
	"id" text PRIMARY KEY NOT NULL,
	"playback_session_id" text NOT NULL,
	"event_type" text NOT NULL,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"startup_latency_ms" integer,
	"rebuffer_duration_ms" integer,
	"rendition_profile" text,
	"region_code" text,
	"error_code" text,
	"correlation_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "playback_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"title_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"grant_id" text NOT NULL,
	"territory_code" text NOT NULL,
	"max_resolution" text NOT NULL,
	"token_hash" text NOT NULL,
	"last_position_seconds" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rights_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"rights_holder_id" text NOT NULL,
	"title_id" text NOT NULL,
	"basis" text NOT NULL,
	"document_ref" text NOT NULL,
	"evidence_sha256" text NOT NULL,
	"submitted_by_user_id" text NOT NULL,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rights_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"asset_id" text,
	"rights_holder_id" text NOT NULL,
	"evidence_id" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"allowed_actions" jsonb NOT NULL,
	"allowed_territories" jsonb NOT NULL,
	"excluded_territories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"required_entitlement" text DEFAULT 'FREE' NOT NULL,
	"max_resolution" text DEFAULT '1080p' NOT NULL,
	"requires_drm" boolean DEFAULT false NOT NULL,
	"attribution_text" text,
	"created_by_user_id" text NOT NULL,
	"approved_by_user_id" text,
	"approved_at" timestamp with time zone,
	"revoked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rights_holders" (
	"id" text PRIMARY KEY NOT NULL,
	"legal_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"country_code" text DEFAULT 'BD' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "takedown_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"title_id" text,
	"target_path" text NOT NULL,
	"reporter_name" text NOT NULL,
	"reporter_email" text NOT NULL,
	"claim_summary" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"legal_hold_applied" boolean DEFAULT false NOT NULL,
	"handled_by_user_id" text,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "replication_tasks" (
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

CREATE TABLE IF NOT EXISTS "drm_configurations" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"drm_system" text NOT NULL,
	"provider_config_ref" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "collections_slug_unique" ON "collections" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "genres_slug_unique" ON "genres" ("slug");
CREATE INDEX IF NOT EXISTS "metadata_sources_title_idx" ON "metadata_sources" ("title_id");
CREATE UNIQUE INDEX IF NOT EXISTS "people_slug_unique" ON "people" ("slug");
CREATE INDEX IF NOT EXISTS "title_credits_title_idx" ON "title_credits" ("title_id");
CREATE INDEX IF NOT EXISTS "title_credits_person_idx" ON "title_credits" ("person_id");
CREATE INDEX IF NOT EXISTS "title_genres_genre_idx" ON "title_genres" ("genre_id");
CREATE UNIQUE INDEX IF NOT EXISTS "title_translations_title_locale_unique" ON "title_translations" ("title_id","locale");
CREATE INDEX IF NOT EXISTS "title_translations_locale_idx" ON "title_translations" ("locale");
CREATE UNIQUE INDEX IF NOT EXISTS "titles_slug_unique" ON "titles" ("slug");
CREATE INDEX IF NOT EXISTS "titles_status_published_idx" ON "titles" ("status","published_at");
CREATE INDEX IF NOT EXISTS "titles_language_year_idx" ON "titles" ("original_language","release_year");
CREATE INDEX IF NOT EXISTS "watchlist_items_user_created_idx" ON "watchlist_items" ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "mfa_factors_user_idx" ON "mfa_factors" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_unique" ON "sessions" ("token_hash");
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_idx" ON "sessions" ("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_role_unique" ON "user_roles" ("user_id","role");
CREATE INDEX IF NOT EXISTS "user_roles_user_idx" ON "user_roles" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "media_assets_title_state_idx" ON "media_assets" ("title_id","lifecycle_state");
CREATE UNIQUE INDEX IF NOT EXISTS "media_objects_bucket_key_unique" ON "media_objects" ("bucket","object_key");
CREATE INDEX IF NOT EXISTS "media_objects_asset_idx" ON "media_objects" ("asset_id");
CREATE INDEX IF NOT EXISTS "media_renditions_asset_idx" ON "media_renditions" ("asset_id");
CREATE UNIQUE INDEX IF NOT EXISTS "outbox_jobs_type_idempotency_unique" ON "outbox_jobs" ("job_type","idempotency_key");
CREATE INDEX IF NOT EXISTS "outbox_jobs_status_idx" ON "outbox_jobs" ("status","created_at");
CREATE INDEX IF NOT EXISTS "subtitle_tracks_asset_idx" ON "subtitle_tracks" ("asset_id");
CREATE INDEX IF NOT EXISTS "audit_events_target_idx" ON "audit_events" ("target_type","target_id");
CREATE INDEX IF NOT EXISTS "audit_events_created_idx" ON "audit_events" ("created_at");
CREATE INDEX IF NOT EXISTS "delivery_events_session_idx" ON "delivery_events" ("playback_session_id");
CREATE UNIQUE INDEX IF NOT EXISTS "playback_sessions_token_hash_unique" ON "playback_sessions" ("token_hash");
CREATE INDEX IF NOT EXISTS "playback_sessions_user_active_idx" ON "playback_sessions" ("user_id","expires_at");
CREATE INDEX IF NOT EXISTS "rights_evidence_title_idx" ON "rights_evidence" ("title_id");
CREATE INDEX IF NOT EXISTS "rights_grants_title_status_idx" ON "rights_grants" ("title_id","status");
CREATE INDEX IF NOT EXISTS "rights_grants_asset_idx" ON "rights_grants" ("asset_id");
CREATE UNIQUE INDEX IF NOT EXISTS "takedown_cases_case_number_unique" ON "takedown_cases" ("case_number");
CREATE INDEX IF NOT EXISTS "takedown_cases_title_status_idx" ON "takedown_cases" ("title_id","status");
CREATE INDEX IF NOT EXISTS "delivery_events_type_occurred_idx" ON "delivery_events" ("event_type","occurred_at");
CREATE INDEX IF NOT EXISTS "delivery_events_occurred_idx" ON "delivery_events" ("occurred_at");
CREATE INDEX IF NOT EXISTS "replication_tasks_object_idx" ON "replication_tasks" ("storage_object_id");
CREATE INDEX IF NOT EXISTS "replication_tasks_status_idx" ON "replication_tasks" ("status","updated_at");
CREATE INDEX IF NOT EXISTS "replication_tasks_provider_region_idx" ON "replication_tasks" ("target_provider","target_region");
CREATE INDEX IF NOT EXISTS "drm_configurations_provider_system_idx" ON "drm_configurations" ("provider","drm_system","is_active");
`;
