import React from 'react';
import { Link as GatsbyLink } from 'gatsby';
import useStyles from './index.styles';

const Link = ({ to, dark = false, children, className = '' }: LinkProps) => {
  const classes = useStyles({ dark });
  return (
    <GatsbyLink to={to} className={`${classes.link} ${className}`}>
      {children}
    </GatsbyLink>
  );
};

export interface LinkProps {
  to: string;
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default Link;
