import React from "react";
import SkeletonLoader from "../loaders/SkeletonLoader";
import Image from "next/image";

interface dataProps {
  image: string;
  title: string;
  percentage: string;
  extraText?: string;
  titleColor?: string;
  txtColor?: string;
  subTxt?: string;
  boldTitle?: boolean;
  imageSize?: number; // Optional image size
}

interface RowListProps {
  data: Array<dataProps>;
  cols: number;
  type: string;
  showDivider: boolean;
  status: string;
  msg: (message: string) => void;
}

function RowList({ data, type, showDivider, status }: RowListProps) {
  if (status === "connecting") {
    return <SkeletonLoader />;
  }

  return (
    <div className={type === "cols" ? `grid grid-cols-2 gap-4` : `grid grid-cols-1  max-h-52 `}>
      {data?.map((record: dataProps, index: number) => (
        <React.Fragment key={index}>
          <div>
            <div className="flex items-center justify-start">
                <div className="rad-circle">
                  <Image
                    src={record?.image} 
                    alt="" 
                    style={{
                      width: record.imageSize ? `${record.imageSize}px` : "40px",
                      height: record.imageSize ? `${record.imageSize}px` : "40px",
                    }} 
                  />
                </div>
              <div className="ml-4 mb-4">
                <h5 className={`tab-card-row-title text-base ${record?.titleColor} ${record?.boldTitle ? 'font-semibold text-lg' : 'text-neutral-600'}`}>
                  {record?.title}
                </h5>
                <h4 className={`tab-card-percent text-2xl ${record?.txtColor} font-bold`}>
                  {record?.percentage}
                  <span className="text-neutral-400 font-normal text-sm"> {record?.subTxt}</span>
                </h4>
              </div>
            </div>
            <p className="text-neutral-500">{record?.extraText}</p>
          </div>
          {showDivider && index + 1 !== data?.length && <div className="border-t border-gray-200"></div>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default RowList;
