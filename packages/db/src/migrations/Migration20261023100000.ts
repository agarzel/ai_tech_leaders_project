import { Migration } from '@mikro-orm/migrations';

// Hand-written (no database was available to generate it): adds the nullable password hash column to users.
export class Migration20261023100000 extends Migration {

  override name = 'Migration20261023100000';

  override up(): void | Promise<void> {
    this.addSql(`alter table "users" add column "password_hash" varchar(255) null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "users" drop column "password_hash";`);
  }

}
