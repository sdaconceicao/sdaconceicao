import * as React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/Layout';
import Seo from '../components/SEO';
import About from '../components/About';
import BlogPosts from '../components/BlogPosts';
import Projects from '../components/Projects';

const BlogIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`;
  const posts = data.allMdx.nodes;
  const projects = data.projects.nodes;

  return (
    <Layout location={location} title={siteTitle}>
      <Seo title="All posts" />
      <About />
      <h3>Portfolio</h3>
      <Projects projects={projects} />
      <h3>Blog</h3>
      <BlogPosts posts={posts} />
    </Layout>
  );
};

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
