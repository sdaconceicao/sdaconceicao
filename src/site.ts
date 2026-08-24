/** Single source of truth for identity, nav, and social links. */

export const SITE = {
  name: "Stephen Andrew Designs",
  author: "Stephen da Conceicao",
  role: "Frontend Lead",
  tagline:
    "Call me Steve. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
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

/** Lives in /public, so the path is the URL. Referenced by the rail and by the
 *  Experience section, which is why it is not inlined at either call site. */
export const RESUME_HREF = "/Resume.pdf";

export const SITE_LINKS = [
  { href: "/projects", label: "All projects" },
  { href: "/blog", label: "Blog" },
] as const;

export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/sdaconceicao", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/sdaconceicao", icon: "linkedin" },
  { label: "Resume", href: RESUME_HREF, icon: "file-text" },
] as const;
