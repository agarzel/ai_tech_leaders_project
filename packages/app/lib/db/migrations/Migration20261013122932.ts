import { Migration } from '@mikro-orm/migrations';

export class Migration20261013122932 extends Migration {

  override name = 'Migration20261013122932';

  override up(): void | Promise<void> {
    this.addSql(`create table "user" ("id" uuid not null, "email" varchar(255) not null, "name" varchar(255) not null, "role" text not null default 'mentee', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`alter table "user" add constraint "user_role_check" check ("role" in ('mentor', 'mentee', 'admin'));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "user" cascade;`);
  }

}
