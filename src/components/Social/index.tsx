import React from 'react';
import { FaLinkedin } from '@react-icons/all-files/fa/FaLinkedin';
import { FaGithubSquare } from '@react-icons/all-files/fa/FaGithubSquare';

import useStyles from './index.styles';

const Icons = {
  linkedIn: <FaLinkedin />,
  github: <FaGithubSquare />
};

const Contact = ({ list, buttonClassname = '' }: ContactProps) => {
  const classes = useStyles();

  return (
    <div className={classes.contact}>
      <ul className={classes.list}>
        {list.map(({ type, url }) => (
          <li className={classes.listItem} key={type}>
            <a
              className={`${classes.link} ${buttonClassname}`}
              href={url}
              rel="noreferrer"
              target="_blank"
            >
              {Icons[type]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export enum IconType {
  linkedIn = 'linkedIn',
  github = 'github'
}
export interface ContactProps {
  list: [
    {
      type: IconType;
      url: string;
    }
  ];
  buttonClassname?: string;
}

export default Contact;
