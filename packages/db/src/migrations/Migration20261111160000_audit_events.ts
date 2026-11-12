import { Migration } from '@mikro-orm/migrations';

export class Migration20261111160000_audit_events extends Migration {

  override name = 'Migration20261111160000_audit_events';

  override up(): void | Promise<void> {
    this.addSql(`create table "audit_events" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "occurred_at" timestamptz not null, "actor_kind" varchar(255) not null, "actor_user_id" uuid null, "action" varchar(255) not null, "target_user_id" uuid null, "details" jsonb not null default '{}', primary key ("id"));`);
    this.addSql(`create index "audit_events_occurred_at_index" on "audit_events" ("occurred_at");`);
    this.addSql(`create index "audit_events_actor_user_id_index" on "audit_events" ("actor_user_id");`);
    this.addSql(`create index "audit_events_action_occurred_at_index" on "audit_events" ("action", "occurred_at");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "audit_events" cascade;`);
  }

}
