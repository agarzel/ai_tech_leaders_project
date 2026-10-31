import { Migration } from '@mikro-orm/migrations';

export class Migration20261031072736 extends Migration {

  override name = 'Migration20261031072736';

  override up(): void | Promise<void> {
    this.addSql(`alter table "payments" add "refund_failure_ids" jsonb not null default '[]';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "payments" drop column "refund_failure_ids";`);
  }

}
