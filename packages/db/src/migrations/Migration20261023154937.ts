import { Migration } from '@mikro-orm/migrations';

export class Migration20261023154937 extends Migration {

  override name = 'Migration20261023154937';

  override up(): void | Promise<void> {
    this.addSql(`create table "mentor_invitations" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, "token_hash" varchar(255) not null, "expires_at" timestamptz not null, "used_at" timestamptz null, "revoked_at" timestamptz null, "created_by_id" uuid not null, "used_by_id" uuid null, primary key ("id"));`);
    this.addSql(`create index "mentor_invitations_email_index" on "mentor_invitations" ("email");`);
    this.addSql(`alter table "mentor_invitations" add constraint "mentor_invitations_token_hash_unique" unique ("token_hash");`);

    this.addSql(`alter table "mentor_invitations" add constraint "mentor_invitations_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id");`);
    this.addSql(`alter table "mentor_invitations" add constraint "mentor_invitations_used_by_id_foreign" foreign key ("used_by_id") references "users" ("id") on delete set null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "mentor_invitations" cascade;`);
  }

}
