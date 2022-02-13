const colors = {
  primary: '#0099FF',
  primaryDark: '#1a4171',
  primaryLight: '#308ce6',
  secondary: '#ccc',
  secondaryDark: '#9a9a9a',
  secondaryLight: '#e0e0e0',
  tertiary: '#646464',
  tertiaryDark: '#202221',
  tertiaryLight: '#a2aaa5',
  success: '#439843',
  successDark: '#2c572c',
  successLight: '#b5eeb5',
  warning: '#f79722',
  warningDark: '#764612',
  warningLight: '#ffca88',
  error: '#de4045',
  errorDark: '#762427',
  errorLight: '#ffbbbb',
  info: '#2a7bca',
  infoDark: '#1a4171',
  infoLight: '#c3ecff',
  white: '#fff',
  g100: '#f1f1f1',
  g200: '#eee',
  g300: '#ddd',
  g400: '#a7a7a7',
  g500: '#808080',
  g600: '#333',
  g700: '#010101',
  black: '#000'
};

const theme = {
  maxWidth: 1120,
  palette: {
    primaryBg: colors.primary,
    primaryFg: colors.white,
    primaryBorder: colors.primary,
    primaryBgHover: colors.primaryDark,
    primaryFgHover: colors.white,
    primaryBorderHover: colors.primaryDark,
    secondaryBg: colors.secondary,
    secondaryFg: colors.g600,
    secondaryBorder: colors.secondaryDark,
    secondaryBgHover: colors.secondaryDark,
    secondaryFgHover: colors.white,
    secondaryBorderHover: colors.secondaryDark,
    tertiaryBg: colors.tertiary,
    tertiaryFg: colors.white,
    tertiaryBorder: colors.tertiary,
    tertiaryBgHover: colors.tertiaryDark,
    tertiaryFgHover: colors.g100,
    tertiaryBorderHover: colors.tertiaryDark,
    link: colors.primary,
    linkLight: colors.white,
    ...colors
  },
  font: {
    fontFamily: "'Roboto', 'Arial', 'sans-serif'",
    fontSize: '.9rem'
  }
};

module.exports = {
  siteMetadata: {
    title: `Stephen Andrew Designs`,
    author: {
      name: `Stephen da Conceicao`,
      summary: `I make stuff`
    },
    description: `A starter blog demonstrating what Gatsby can do.`,
    siteUrl: `http://stephenandrewdesigns.com`,
    contact: [
      { type: 'linkedIn', url: `https://www.linkedin.com/in/sdaconceicao/` },
      { type: 'github', url: `https://github.com/sdaconceicao` },
      { type: 'mail', url: 'mailto:stephen@stephenandrewdesigns.com' }
    ]
  },
  plugins: [
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/portfolio`,
        name: `portfolio`
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`
      }
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 630
            }
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`
            }
          },
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`
        ],
        extensions: [`.md`, `.mdx`]
      }
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 630
            }
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`
            }
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`
        ]
      }
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `UA-32901858-1`
      }
    },
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMdx } }) => {
              return allMdx.nodes.map((node) => {
                return Object.assign({}, node.frontmatter, {
                  description: node.excerpt,
                  date: node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + node.fields.slug,
                  guid: site.siteMetadata.siteUrl + node.fields.slug,
                  custom_elements: [{ 'content:encoded': node.html }]
                });
              });
            },
            query: `
              {
                allMdx(
                  sort: { order: DESC, fields: [frontmatter___date] },
                ) {
                  nodes {
                    excerpt
                    body
                    fields {
                      slug
                    }
                    frontmatter {
                      title
                      date
                    }
                  }
                }
              }
            `,
            output: '/rss.xml',
            title: 'Stephen Andrew Designs'
          }
        ]
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Stephen Andrew Designs`,
        short_name: `SAD`,
        start_url: `/`,
        background_color: `#ffffff`,
        // This will impact how browsers show your PWA/website
        // https://css-tricks.com/meta-theme-color-and-trickery/
        // theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png` // This path is relative to the root of the site.
      }
    },
    {
      resolve: 'gatsby-plugin-jss',
      options: { theme }
    },
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-offline`
  ]
};
