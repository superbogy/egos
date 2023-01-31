import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Link, SelectLang, useIntl, connect, OutLet } from 'umi';
import React from 'react';
import logo from '../assets/logo.svg';
import styles from './user.less';

const Security = (props) => {
  const { children } = props;
  const title = 'egos';
  console.log('here is security ==>>>', props);
  return (
    <HelmetProvider>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={title} />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.lang}></div>
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.header}>
              <Link to="/">
                <img alt="logo" className={styles.logo} src={logo} />
                <span className={styles.title}>2Gos</span>
              </Link>
            </div>
            <div className={styles.desc}>二狗子</div>
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
};

export default connect(({ settings, children }) => ({ ...settings, children }))(
  Security,
);
