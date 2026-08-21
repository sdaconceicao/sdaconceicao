/** Single source of truth for identity, nav, and social links. */

export const SITE = {
  name: "Stephen Andrew Designs",
  author: "Stephen da Conceicao",
  role: "Frontend Lead",
  tagline:
    "Call me Steve. ",
  description:
    "Frontend engineer with 15+ years of experience, focused on accessibility and internationalization. Portfolio, writing, and work history.",
  url: "https://stephenandrewdesigns.com",
  locale: "en",
  /** Career start, used to derive the years-of-experience line. */
  careerStart: new Date("2006-01-01T00:00:00Z"),
} as const;

export const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "writing", label: "Writing" },
] as const;

export const SITE_LINKS = [
  { href: "/projects", label: "All projects" },
  { href: "/blog", label: "Blog" },
] as const;

export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/sdaconceicao", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/sdaconceicao", icon: "linkedin" },
] as const;
