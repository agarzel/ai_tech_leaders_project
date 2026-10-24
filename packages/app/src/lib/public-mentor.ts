import type { PublicMentorDto } from "@devmentor/core";
import type { PublicMentor } from "@devmentor/ui/components/mentors/MentorProfileHeader";

/** The service DTO in the shape the presentational components take (ui does not import core). */
export function toPublicMentor(dto: PublicMentorDto): PublicMentor {
  return { ...dto, slug: dto.shareSlug, soonestSlotAt: dto.soonestBookableSlotAt };
}
