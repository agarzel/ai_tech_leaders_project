import { Migration } from '@mikro-orm/migrations';

export class Migration20261031131551_session_note_rejected_replacement extends Migration {

  override name = 'Migration20261031131551_session_note_rejected_replacement';

  override up(): void | Promise<void> {
    this.addSql(`alter table "session_notes" add "rejected_replacement_count" int not null default 0, add "replaced_at" timestamptz null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "session_notes" drop column "rejected_replacement_count", drop column "replaced_at";`);
  }

}
