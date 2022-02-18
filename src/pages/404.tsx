import * as React from 'react';
import { graphql } from 'gatsby';

import Layout from 'components/Layout';
import Seo from 'components/SEO';

const NotFoundPage = ({ location }: NotFoundPageProps) => {
  return (
    <Layout location={location}>
      <Seo title="404: Not Found" />
      <h1>404: Not Found</h1>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </Layout>
  );
};

export interface NotFoundPageProps {
  location: Location;
}
export default NotFoundPage;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
