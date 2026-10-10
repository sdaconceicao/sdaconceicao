import { describe, expect, it } from "vitest";
import { SITE } from "../site";
import { getSiteJsonLd } from "./structured-data";

describe("getSiteJsonLd", () => {
  it("emits the linked WebSite and Person graph for the homepage", () => {
    const jsonLd = getSiteJsonLd("/", SITE);
    const graph = JSON.parse(jsonLd ?? "")["@graph"];

    expect(graph[0]).toMatchObject({
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: SITE.brandName,
      description: SITE.description,
      creator: { "@id": `${SITE.url}/#person` },
    });
    expect(graph[1]).toMatchObject({
      "@type": "Person",
      "@id": `${SITE.url}/#person`,
      name: SITE.author,
      alternateName: "Steve da Conceicao",
      jobTitle: "Staff Software Engineer",
      email: SITE.email,
      sameAs: SITE.socials.map((social) => social.href),
      knowsAbout: [
        "Frontend Architecture",
        "React",
        "Design Systems",
        "Web Accessibility",
        "CI/CD",
        "Agentic AI",
      ],
    });
  });

  it("omits site-level JSON-LD from other routes", () => {
    expect(getSiteJsonLd("/blog/", SITE)).toBeUndefined();
  });

  it("escapes markup before insertion into a script element", () => {
    const jsonLd = getSiteJsonLd("/", {
      ...SITE,
      description: "A </script><script>alert(1)</script>",
    });

    expect(jsonLd).not.toContain("</script>");
    expect(JSON.parse(jsonLd ?? "")["@graph"][0].description).toBe(
      "A </script><script>alert(1)</script>",
    );
  });
});
