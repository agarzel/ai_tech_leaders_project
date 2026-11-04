import { Migration } from '@mikro-orm/migrations';

export class Migration20261104120044_user_sessions_revoked_at extends Migration {

  override name = 'Migration20261104120044_user_sessions_revoked_at';

  override up(): void | Promise<void> {
    this.addSql(`alter table "users" add "sessions_revoked_at" timestamptz null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "users" drop column "sessions_revoked_at";`);
  }

}
