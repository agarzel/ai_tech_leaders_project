import { Migration } from '@mikro-orm/migrations';

export class Migration20261026090000_bookings_and_payments extends Migration {

  override name = 'Migration20261026090000_bookings_and_payments';

  override up(): void | Promise<void> {
    this.addSql(`create table "bookings" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "slot_id" uuid not null, "mentee_id" uuid not null, "mentor_id" uuid not null, "length_minutes" int not null, "price_amount" int not null, "currency" varchar(3) not null default 'PLN', "question" text not null, "status" varchar(255) not null default 'pending_payment', "hold_expires_at" timestamptz not null, "accept_by" timestamptz null, "entry_point" varchar(255) not null default 'unknown', "decided_at" timestamptz null, "decline_reason" varchar(280) null, primary key ("id"));`);
    this.addSql(`create index "bookings_status_accept_by_index" on "bookings" ("status", "accept_by");`);
    this.addSql(`create index "bookings_status_hold_expires_at_index" on "bookings" ("status", "hold_expires_at");`);

    this.addSql(`create table "payments" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "booking_id" uuid not null, "provider" varchar(255) not null, "status" varchar(255) not null default 'creating', "checkout_idempotency_key" varchar(255) not null, "checkout_session_id" varchar(255) null, "payment_intent_id" varchar(255) null, "amount" int not null, "currency" varchar(3) not null default 'PLN', "refund_id" varchar(255) null, "refund_attempts" int not null default 0, "paid_at" timestamptz null, "refunded_at" timestamptz null, "last_error" text null, primary key ("id"));`);
    this.addSql(`alter table "payments" add constraint "payments_booking_id_unique" unique ("booking_id");`);
    this.addSql(`alter table "payments" add constraint "payments_checkout_session_id_unique" unique ("checkout_session_id");`);
    this.addSql(`alter table "payments" add constraint "payments_payment_intent_id_unique" unique ("payment_intent_id");`);

    this.addSql(`alter table "bookings" add constraint "bookings_slot_id_foreign" foreign key ("slot_id") references "slots" ("id") on delete restrict;`);
    this.addSql(`alter table "bookings" add constraint "bookings_mentee_id_foreign" foreign key ("mentee_id") references "users" ("id") on delete restrict;`);
    this.addSql(`alter table "bookings" add constraint "bookings_mentor_id_foreign" foreign key ("mentor_id") references "mentor_profiles" ("id") on delete restrict;`);

    this.addSql(`alter table "payments" add constraint "payments_booking_id_foreign" foreign key ("booking_id") references "bookings" ("id") on delete cascade;`);

    // HAND-WRITTEN (MikroORM cannot express the partial predicate in the entity) - review before changing.
    // One live booking per slot; terminal bookings (declined, expired, payment_expired) do not block a rebooking.
    // The predicate must match LIVE_BOOKING_STATUSES in booking.entity.ts.
    this.addSql(`create unique index "bookings_slot_id_live_unique" on "bookings" ("slot_id") where "status" in ('pending_payment', 'awaiting_acceptance', 'confirmed');`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "payments" cascade;`);
    this.addSql(`drop table if exists "bookings" cascade;`);
  }

}
