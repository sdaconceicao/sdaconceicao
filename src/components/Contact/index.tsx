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

const Contact = ({ list }: ContactProps) => {
  const classes = useStyles();

  return (
    <div className={classes.contact}>
      <ul className={classes.list}>
        {list.map(({ type, url }) => (
          <li className={classes.listItem} key={type}>
            <a className={classes.link} href={url} rel="noreferrer" target="_blank">
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
  github = 'github',
  mail = 'mail'
}
export interface ContactProps {
  list: [
    {
      type: IconType;
      url: string;
    }
  ];
}

export default Contact;
