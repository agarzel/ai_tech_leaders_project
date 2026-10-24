import Link from "next/link";
import type { RenderLink } from "@devmentor/ui/backend/layout/links";

export const renderNextLink: RenderLink = ({ href, ...props }) => <Link href={href} {...props} />;
