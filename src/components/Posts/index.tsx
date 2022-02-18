import React from 'react';
import Post, { PostProps } from 'components/Post';
import useStyles from './index.styles';

const Posts = ({ posts }: PostsProps) => {
  const classes = useStyles();

  if (posts.length < 1) {
    return (
      <p>
        No blog posts found. Add markdown posts to "content/blog" (or the directory you specified
        for the "gatsby-source-filesystem" plugin in gatsby-config.js).
      </p>
    );
  }
  return (
    <ol className={classes.posts}>
      {posts.map((post) => (
        <li key={post.fields.slug}>
          <Post {...post} />
        </li>
      ))}
    </ol>
  );
};

export interface PostsProps {
  posts: [PostProps];
}

export default Posts;
