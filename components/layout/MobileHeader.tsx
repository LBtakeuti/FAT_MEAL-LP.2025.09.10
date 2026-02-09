import MobileHeaderClient from './MobileHeaderClient';

// サーバーコンポーネント - クライアントコンポーネントをラップ
const MobileHeader: React.FC = () => {
  return <MobileHeaderClient />;
};

export default MobileHeader;
