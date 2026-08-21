/** Single source of truth for identity, nav, and social links. */

export const SITE = {
  /** The brand. Lives in <title>, the footer, and the OG image. */
  name: "Stephen Andrew Designs",
  /** The person. This is the <h1>, once per page -- the two never compete. */
  author: "Stephen da Conceicao",
  /** "da Con Say Sone" */
  role: "Frontend Engineer",
  tagline:
    "Call me Steve. I build accessible, well-translated interfaces — and I care a lot about the details most people never notice.",
  description:
    "Frontend engineer with 15+ years of experience, focused on accessibility and internationalization. Portfolio, writing, and work history.",
  url: "https://stephenandrewdesigns.com",
  locale: "en",
  /** Career start, used to derive the years-of-experience line. */
  careerStart: new Date("2010-01-01T00:00:00Z"),
} as const;

export const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "writing", label: "Writing" },
] as const;

export const SITE_LINKS = [{ href: "/blog", label: "Blog" }] as const;

export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/sdaconceicao", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/sdaconceicao", icon: "linkedin" },
] as const;
