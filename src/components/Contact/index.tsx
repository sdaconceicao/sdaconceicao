import React from 'react';
import { FaLinkedin } from '@react-icons/all-files/fa/FaLinkedin';
import { FaGithubSquare } from '@react-icons/all-files/fa/FaGithubSquare';
import { FaEnvelope } from '@react-icons/all-files/fa/FaEnvelope';

import useStyles from './index.styles';

const Icons = {
  linkedIn: <FaLinkedin />,
  github: <FaGithubSquare />,
  mail: <FaEnvelope />
};

const Contact = ({ list }: Contact) => {
  const classes = useStyles();

  return (
    <div className={classes.contact}>
      <ul className={classes.list}>
        {list.map(({ type, url }) => (
          <li className={classes.listItem}>
            <a className={classes.link} href={url} rel="noreferrer" target="_blank">
              {Icons[type]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export interface Contact {
  list: [
    {
      type: string;
      url: string;
    }
  ];
}

export default Contact;
