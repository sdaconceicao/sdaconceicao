import * as React from 'react';
import { graphql } from 'gatsby';

import Layout from 'components/Layout';
import Seo from 'components/SEO';
import About from 'components/About';
import Posts from 'components/Posts';
import Projects from 'components/Projects';
import { ProjectProps } from 'components/Project';
import { PostProps } from 'components/Post';

const BlogIndex = ({ data, location }: BlogIndex) => {
  const posts = data.allMdx.nodes;
  const projects = data.projects.nodes;

  return (
    <Layout location={location} headerContent={<About />}>
      <Seo title="All posts" />
      <Projects projects={projects} />
      <h3>Blog</h3>
      <Posts posts={posts} />
    </Layout>
  );
};

export interface BlogIndex {
  data: {
    allMdx: {
      nodes: [PostProps];
    };
    projects: {
      nodes: [ProjectProps];
    };
  };
  location: Location;
}
export default BlogIndex;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMdx(
      filter: { fields: { instance: { eq: "blog" } } }
      sort: { fields: [frontmatter___date], order: ASC }
      limit: 1000
    ) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
          featuredImage {
            childImageSharp {
              gatsbyImageData(width: 200)
            }
          }
        }
      }
    }
    projects: allMdx(
      filter: { fields: { instance: { eq: "portfolio" } } }
      sort: { fields: [frontmatter___date], order: ASC }
      limit: 1000
    ) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
        }
      }
    }
  }
`;
