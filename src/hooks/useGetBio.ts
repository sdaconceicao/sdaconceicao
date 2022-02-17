import { useStaticQuery, graphql } from 'gatsby';

const useGetBio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      site {
        siteMetadata {
          author {
            name
            summary
          }
          contact {
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
