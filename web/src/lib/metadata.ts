import type { Metadata } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

const SITE_NAME = "Debate Fact Checker";
const DEFAULT_TITLE =
  "Debate Fact Checker — Gish Gallop, firehosing, and source-verified claims";
const DEFAULT_DESCRIPTION =
  "Paste a YouTube debate or monologue. Get a citeable breakdown of misleading rhetoric — with sources in agent mode.";

const OG_IMAGE_PATH = "/og-image.png";
const OG_IMAGE_ALT =
  "Debate Fact Checker — analyze debate monologues for rhetoric tricks and fact-check claims";

/** Shared Open Graph + Twitter card fields for social link previews. */
export function buildSocialMetadata(overrides?: {
  title?: string;
  description?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const title = overrides?.title ?? DEFAULT_TITLE;
  const description = overrides?.description ?? DEFAULT_DESCRIPTION;
  const imageUrl = absoluteUrl(OG_IMAGE_PATH);

  return {
    openGraph: {
      type: "website",
      locale: "en_US",
      url: getSiteUrl(),
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: OG_IMAGE_ALT,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  ...buildSocialMetadata(),
};
