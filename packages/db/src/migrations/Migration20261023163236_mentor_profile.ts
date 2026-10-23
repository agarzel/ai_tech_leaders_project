import { Migration } from '@mikro-orm/migrations';

export class Migration20261023163236_mentor_profile extends Migration {

  override name = 'Migration20261023163236_mentor_profile';

  override up(): void | Promise<void> {
    this.addSql(`create table "mentor_profiles" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "headline" varchar(120) null, "bio" text null, "tags" jsonb not null default '[]', "links" jsonb not null default '[]', "price25" int null, "price50" int null, "share_slug" varchar(255) not null, "listed" boolean not null default false, primary key ("id"));`);
    this.addSql(`alter table "mentor_profiles" add constraint "mentor_profiles_user_id_unique" unique ("user_id");`);
    this.addSql(`alter table "mentor_profiles" add constraint "mentor_profiles_share_slug_unique" unique ("share_slug");`);

    this.addSql(`alter table "mentor_profiles" add constraint "mentor_profiles_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "mentor_profiles" cascade;`);
  }

}
