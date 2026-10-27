import { Migration } from '@mikro-orm/migrations';

export class Migration20261027124735 extends Migration {

  override name = 'Migration20261027124735';

  override up(): void | Promise<void> {
    this.addSql(`create table "session_notes" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "booking_id" uuid not null, "body" text not null, "status" varchar(255) not null default 'draft', "decided_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "session_notes" add constraint "session_notes_booking_id_unique" unique ("booking_id");`);

    this.addSql(`create table "messages" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "booking_id" uuid not null, "author_id" uuid not null, "body" text not null, primary key ("id"));`);
    this.addSql(`create index "messages_booking_id_created_at_index" on "messages" ("booking_id", "created_at");`);

    this.addSql(`alter table "session_notes" add constraint "session_notes_booking_id_foreign" foreign key ("booking_id") references "bookings" ("id") on delete restrict;`);

    this.addSql(`alter table "messages" add constraint "messages_booking_id_foreign" foreign key ("booking_id") references "bookings" ("id") on delete restrict;`);
    this.addSql(`alter table "messages" add constraint "messages_author_id_foreign" foreign key ("author_id") references "users" ("id") on delete restrict;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "session_notes" cascade;`);
    this.addSql(`drop table if exists "messages" cascade;`);
  }

}
