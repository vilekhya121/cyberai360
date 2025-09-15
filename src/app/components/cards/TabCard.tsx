import React, { useState } from 'react';
import { Card } from 'antd';


interface TabCardProps {
  title: string;
  tabsData: {tab: string; key: string}[];
  contentList: {[key: string]: React.FC};
  extra?: React.ReactNode;
}

const TabCard = ({title,tabsData,contentList,extra}:TabCardProps) => {

  const [activeKey, setActiveKey] = useState(tabsData && tabsData[0]?.key || '1');

  const onTabChange = (key:string) => {
    setActiveKey(key);
  };

  const ActiveComponent = contentList[activeKey];


  return (
    <>
      <Card
        style={{ 
          width: '100%',
          height:'100%'
         }}
        title={title}
        extra={extra}
        tabList={tabsData?.length ? tabsData : []}
        activeTabKey={activeKey}
        onTabChange={onTabChange}
      >
        {ActiveComponent ? <ActiveComponent /> : <div>No Content Available</div>}
      </Card>
    </>
  );
};

export default TabCard;