// components/NotificationCard.tsx

import { Card } from "antd";
import Image from "next/image";
import React from "react";

interface dataProps {
  type: string;
  title: string;
  message: string;
  time: string;
}

interface NotificationProps {
  data: dataProps[];
}

const NotificationCard: React.FC<NotificationProps> = ({ data }) => {
  return (
    <div className="">
      <Card title="Alerts">
        {data.map((record, index) => (
          <div key={index}>
            <div className="flex items-center">
              <div className="rad-circle">
                <Image src={`${record.type}`} alt="" />
              </div>
              <div className="ml-4 my-4">
                <h5 className="font-xl">{record.title}</h5>
                <h4 className="tab-card-percent">{record.message}</h4>
                <h4 className="tab-card-percent">{record.time}</h4>
              </div>
            </div>
            <hr className="mb-3" />
          </div>
        ))}
      </Card>
    </div>
  );
};

export default NotificationCard;
