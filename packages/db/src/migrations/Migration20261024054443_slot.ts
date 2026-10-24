import { Migration } from '@mikro-orm/migrations';

export class Migration20261024054443_slot extends Migration {

  override name = 'Migration20261024054443_slot';

  override up(): void | Promise<void> {
    this.addSql(`create table "slots" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "mentor_id" uuid not null, "starts_at" timestamptz not null, "status" varchar(255) not null default 'open', primary key ("id"));`);
    this.addSql(`create index "slots_status_starts_at_index" on "slots" ("status", "starts_at");`);
    this.addSql(`alter table "slots" add constraint "slots_mentor_id_starts_at_unique" unique ("mentor_id", "starts_at");`);

    this.addSql(`alter table "slots" add constraint "slots_mentor_id_foreign" foreign key ("mentor_id") references "mentor_profiles" ("id") on delete cascade;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "slots" cascade;`);
  }

}
