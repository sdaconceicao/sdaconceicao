import { useStaticQuery, graphql } from 'gatsby';

const useGetBio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      site {
        siteMetadata {
          title
          author {
            name
            summary
          }
          social {
            type
            url
          }
        }
      }
    }
  `);
  return data;
};

export default useGetBio;
