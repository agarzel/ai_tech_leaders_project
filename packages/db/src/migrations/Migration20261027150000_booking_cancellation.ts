import { Migration } from '@mikro-orm/migrations';

// HAND-WRITTEN (the generator cannot run in the agent sandbox). The snapshot is NOT updated here: the owner runs
// `npm run db:migration:create` with Docker. If it writes the same columns again, keep only the generated file
// and the regenerated snapshot (see the fix commit for the session tables). Review before changing.
export class Migration20261027150000_booking_cancellation extends Migration {

  override name = 'Migration20261027150000_booking_cancellation';

  override up(): void | Promise<void> {
    this.addSql(`alter table "bookings" add column "cancelled_at" timestamptz null, add column "cancel_reason" varchar(20) null;`);
    this.addSql(`alter table "payments" add column "mentor_share_amount" int null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "payments" drop column "mentor_share_amount";`);
    this.addSql(`alter table "bookings" drop column "cancel_reason", drop column "cancelled_at";`);
  }

}
