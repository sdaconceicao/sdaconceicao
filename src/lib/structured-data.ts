interface StructuredDataSite {
  url: string;
  brandName: string;
  description: string;
  author: string;
  email: string;
  socials: readonly { href: string }[];
}

export const getSiteJsonLd = (pathname: string, site: StructuredDataSite): string | undefined => {
  if (pathname !== "/") return undefined;

  const homeUrl = new URL("/", site.url).toString();
  const personId = `${homeUrl}#person`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${homeUrl}#website`,
        url: homeUrl,
        name: site.brandName,
        description: site.description,
        creator: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: site.author,
        alternateName: "Steve da Conceicao",
        url: homeUrl,
        jobTitle: "Staff Software Engineer",
        email: site.email,
        sameAs: site.socials.map((social) => social.href),
        knowsAbout: [
          "Frontend Architecture",
          "React",
          "Design Systems",
          "Web Accessibility",
          "CI/CD",
          "Agentic AI",
        ],
      },
    ],
  };

  return JSON.stringify(graph).replace(/</g, "\\u003c");
};
