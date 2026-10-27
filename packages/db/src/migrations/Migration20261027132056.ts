import { Migration } from '@mikro-orm/migrations';

export class Migration20261027132056 extends Migration {

  override name = 'Migration20261027132056';

  override up(): void | Promise<void> {
    this.addSql(`alter table "bookings" add "cancelled_at" timestamptz null, add "cancel_reason" varchar(20) null;`);

    this.addSql(`alter table "payments" add "mentor_share_amount" int null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "bookings" drop column "cancelled_at", drop column "cancel_reason";`);

    this.addSql(`alter table "payments" drop column "mentor_share_amount";`);
  }

}
