import { Migration } from '@mikro-orm/migrations';

export class Migration20261023155217_mentor_invitation_created_by_set_null extends Migration {

  override name = 'Migration20261023155217_mentor_invitation_created_by_set_null';

  override up(): void | Promise<void> {
    this.addSql(`alter table "mentor_invitations" drop constraint "mentor_invitations_created_by_id_foreign";`);

    this.addSql(`alter table "mentor_invitations" alter column "created_by_id" drop not null;`);
    this.addSql(`alter table "mentor_invitations" add constraint "mentor_invitations_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on delete set null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "mentor_invitations" drop constraint "mentor_invitations_created_by_id_foreign";`);

    this.addSql(`alter table "mentor_invitations" alter column "created_by_id" set not null;`);
    this.addSql(`alter table "mentor_invitations" add constraint "mentor_invitations_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id");`);
  }

}
