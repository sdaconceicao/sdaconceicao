import * as React from 'react';
import { Helmet } from 'react-helmet';
import { graphql, useStaticQuery } from 'gatsby';

const Seo = ({ description = '', lang = 'en', meta = [], title }: SeoProps) => {
  const { site } = useStaticQuery(
    graphql`
      query SeoQuery {
        site {
          siteMetadata {
            title
            description
          }
        }
      }
    `
  );

  const metaDescription = description || site?.siteMetadata.description;
  const defaultTitle = site?.siteMetadata?.title;

  return (
    <Helmet
      htmlAttributes={{
        lang
      }}
      title={title}
      titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : null}
      meta={[
        {
          name: `description`,
          content: metaDescription
        },
        {
          property: `og:title`,
          content: title
        },
        {
          property: `og:description`,
          content: metaDescription
        },
        {
          property: `og:type`,
          content: `website`
        }
      ].concat(meta)}
    />
  );
};

interface PropertyMetaObj {
  property: string;
  content: string;
}

interface NameMetaObj {
  name: string;
  content: string;
}
type Meta = ConcatArray<PropertyMetaObj | NameMetaObj>;

export interface SeoProps {
  description?: string;
  lang?: string;
  meta?: Meta;
  title: string;
}

export default Seo;
