import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import styles from './index.less';

const HomePage: React.FC = () => {
  const global = useModel<any>('global');
  console.log('home', global);
  return (
    <PageContainer ghost>
      <div className={styles.container}>fuck 123</div>
    </PageContainer>
  );
};

export default HomePage;
