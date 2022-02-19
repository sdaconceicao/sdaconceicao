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
    <div className={classes.posts}>
      <h2 className={classes.heading}>Posts</h2>
      <ul>
        {posts.map((post) => (
          <li className={classes.post} key={post.fields.slug}>
            <Post {...post} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export interface PostsProps {
  posts: [PostProps];
}

export default Posts;
