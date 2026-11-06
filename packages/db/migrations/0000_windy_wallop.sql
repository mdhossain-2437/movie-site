CREATE TABLE "collection_items" (
	"collection_id" text NOT NULL,
	"title_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "collection_items_collection_id_title_id_pk" PRIMARY KEY("collection_id","title_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title_en" text NOT NULL,
	"title_bn" text,
	"description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text
);
--> statement-breakpoint
CREATE TABLE "metadata_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text,
	"attribution_text" text NOT NULL,
	"license_confirmed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"person_id" text NOT NULL,
	"department" text NOT NULL,
	"character_name" text,
	"billing_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_genres" (
	"title_id" text NOT NULL,
	"genre_id" text NOT NULL,
	CONSTRAINT "title_genres_title_id_genre_id_pk" PRIMARY KEY("title_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "title_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"title_id" text NOT NULL,
	"locale" text NOT NULL,
	"localized_title" text NOT NULL,
	"tagline" text,
	"synopsis" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "titles" (
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
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"user_id" text NOT NULL,
	"title_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watchlist_items_user_id_title_id_pk" PRIMARY KEY("user_id","title_id")
);
--> statement-breakpoint
CREATE TABLE "mfa_factors" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'TOTP' NOT NULL,
	"secret_base32" text NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
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
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"granted_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"entitlement_tier" text DEFAULT 'FREE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
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
--> statement-breakpoint
CREATE TABLE "media_objects" (
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
--> statement-breakpoint
CREATE TABLE "media_renditions" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"resolution" text NOT NULL,
	"codec" text NOT NULL,
	"bitrate_kbps" integer NOT NULL,
	"manifest_object_key" text NOT NULL,
	"has_configured_drm" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_jobs" (
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
--> statement-breakpoint
CREATE TABLE "subtitle_tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"language_code" text NOT NULL,
	"label" text NOT NULL,
	"object_key" text NOT NULL,
	"is_forced" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
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
--> statement-breakpoint
CREATE TABLE "delivery_events" (
	"id" text PRIMARY KEY NOT NULL,
	"playback_session_id" text NOT NULL,
	"event_type" text NOT NULL,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playback_sessions" (
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
--> statement-breakpoint
CREATE TABLE "rights_evidence" (
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
--> statement-breakpoint
CREATE TABLE "rights_grants" (
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
--> statement-breakpoint
CREATE TABLE "rights_holders" (
	"id" text PRIMARY KEY NOT NULL,
	"legal_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"country_code" text DEFAULT 'BD' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "takedown_cases" (
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
--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metadata_sources" ADD CONSTRAINT "metadata_sources_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_credits" ADD CONSTRAINT "title_credits_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_credits" ADD CONSTRAINT "title_credits_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_genres" ADD CONSTRAINT "title_genres_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_genres" ADD CONSTRAINT "title_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_translations" ADD CONSTRAINT "title_translations_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_factors" ADD CONSTRAINT "mfa_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_qc_approved_by_user_id_users_id_fk" FOREIGN KEY ("qc_approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_renditions" ADD CONSTRAINT "media_renditions_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtitle_tracks" ADD CONSTRAINT "subtitle_tracks_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_playback_session_id_playback_sessions_id_fk" FOREIGN KEY ("playback_session_id") REFERENCES "public"."playback_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_sessions" ADD CONSTRAINT "playback_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_sessions" ADD CONSTRAINT "playback_sessions_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_sessions" ADD CONSTRAINT "playback_sessions_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_sessions" ADD CONSTRAINT "playback_sessions_grant_id_rights_grants_id_fk" FOREIGN KEY ("grant_id") REFERENCES "public"."rights_grants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_evidence" ADD CONSTRAINT "rights_evidence_rights_holder_id_rights_holders_id_fk" FOREIGN KEY ("rights_holder_id") REFERENCES "public"."rights_holders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_evidence" ADD CONSTRAINT "rights_evidence_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_evidence" ADD CONSTRAINT "rights_evidence_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_evidence" ADD CONSTRAINT "rights_evidence_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_grants" ADD CONSTRAINT "rights_grants_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_grants" ADD CONSTRAINT "rights_grants_rights_holder_id_rights_holders_id_fk" FOREIGN KEY ("rights_holder_id") REFERENCES "public"."rights_holders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_grants" ADD CONSTRAINT "rights_grants_evidence_id_rights_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."rights_evidence"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_grants" ADD CONSTRAINT "rights_grants_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights_grants" ADD CONSTRAINT "rights_grants_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takedown_cases" ADD CONSTRAINT "takedown_cases_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takedown_cases" ADD CONSTRAINT "takedown_cases_handled_by_user_id_users_id_fk" FOREIGN KEY ("handled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_slug_unique" ON "collections" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "genres_slug_unique" ON "genres" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "metadata_sources_title_idx" ON "metadata_sources" USING btree ("title_id");--> statement-breakpoint
CREATE UNIQUE INDEX "people_slug_unique" ON "people" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "title_credits_title_idx" ON "title_credits" USING btree ("title_id");--> statement-breakpoint
CREATE INDEX "title_credits_person_idx" ON "title_credits" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "title_genres_genre_idx" ON "title_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "title_translations_title_locale_unique" ON "title_translations" USING btree ("title_id","locale");--> statement-breakpoint
CREATE INDEX "title_translations_locale_idx" ON "title_translations" USING btree ("locale");--> statement-breakpoint
CREATE UNIQUE INDEX "titles_slug_unique" ON "titles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "titles_status_published_idx" ON "titles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "titles_language_year_idx" ON "titles" USING btree ("original_language","release_year");--> statement-breakpoint
CREATE INDEX "watchlist_items_user_created_idx" ON "watchlist_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "mfa_factors_user_idx" ON "mfa_factors" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_role_unique" ON "user_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "media_assets_title_state_idx" ON "media_assets" USING btree ("title_id","lifecycle_state");--> statement-breakpoint
CREATE UNIQUE INDEX "media_objects_bucket_key_unique" ON "media_objects" USING btree ("bucket","object_key");--> statement-breakpoint
CREATE INDEX "media_objects_asset_idx" ON "media_objects" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "media_renditions_asset_idx" ON "media_renditions" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_jobs_type_idempotency_unique" ON "outbox_jobs" USING btree ("job_type","idempotency_key");--> statement-breakpoint
CREATE INDEX "outbox_jobs_status_idx" ON "outbox_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "subtitle_tracks_asset_idx" ON "subtitle_tracks" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "audit_events_target_idx" ON "audit_events" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_events_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "delivery_events_session_idx" ON "delivery_events" USING btree ("playback_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "playback_sessions_token_hash_unique" ON "playback_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "playback_sessions_user_active_idx" ON "playback_sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "rights_evidence_title_idx" ON "rights_evidence" USING btree ("title_id");--> statement-breakpoint
CREATE INDEX "rights_grants_title_status_idx" ON "rights_grants" USING btree ("title_id","status");--> statement-breakpoint
CREATE INDEX "rights_grants_asset_idx" ON "rights_grants" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "takedown_cases_case_number_unique" ON "takedown_cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "takedown_cases_title_status_idx" ON "takedown_cases" USING btree ("title_id","status");