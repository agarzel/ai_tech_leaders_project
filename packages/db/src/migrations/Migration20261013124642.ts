import { Migration } from '@mikro-orm/migrations';

// Engineering Standards: table names are plural. Rename in place (the generated diff would drop the table and its data).
export class Migration20261013124642 extends Migration {

  override name = 'Migration20261013124642';

  override up(): void | Promise<void> {
    this.addSql(`alter table "user" rename to "users";`);
    this.addSql(`alter table "users" rename constraint "user_pkey" to "users_pkey";`);
    this.addSql(`alter table "users" rename constraint "user_email_unique" to "users_email_unique";`);
    this.addSql(`alter table "users" rename constraint "user_role_check" to "users_role_check";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "users" rename constraint "users_role_check" to "user_role_check";`);
    this.addSql(`alter table "users" rename constraint "users_email_unique" to "user_email_unique";`);
    this.addSql(`alter table "users" rename constraint "users_pkey" to "user_pkey";`);
    this.addSql(`alter table "users" rename to "user";`);
  }

}
