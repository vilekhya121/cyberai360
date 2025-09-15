import React, { useState } from "react";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";

interface JsonDataItem {
  [key: string]: string | number;
}

interface CustomHeader {
  label: string;
  name: string | number;
  type?: string;
}

interface TableComponentProps {
  jsonData: JsonDataItem[];
  customHeaders?: CustomHeader[] | boolean;
  arrayData?: CustomHeader[];
  loading: boolean;
  paginate: boolean;
  pageSize: number;
  onchangePageSize: (newPageSize: number) => void;
  pageSizeOptions: number[];
  pageSizeSelected: number;
}

const TableComponent: React.FC<TableComponentProps> = ({
  jsonData,
  arrayData,
  loading,
  paginate,
  onchangePageSize,
  pageSizeOptions,
  pageSizeSelected,
}) => {
  const [page, setPage] = useState<number>(1);
  const columns: ColumnsType<JsonDataItem> =
    jsonData.length > 0
      ? Object.keys(jsonData[0]).map((key) => ({
          title: key.charAt(0).toUpperCase() + key.slice(1),
          dataIndex: key,
          sorter: (a, b) => {
            return Number(a[key]) - Number(b[key]);
          },
          key: key,
          className: "bg-blue-500 text-white",
        }))
      : [];

  const finalColumns: ColumnsType<JsonDataItem> = !arrayData
    ? columns
    : arrayData.map((data, i) => {
        if (data.type === "customVal") {
          return {
            title: `${data.label}`,
            dataIndex: `${data.name}`,
            key: `${i}`,
            width: 150,
            textWrap: "word-break",
            ellipsis: true,
            // fixed: i < 1 ? "left" : undefined,
            // sorter: (a, b) => {
            //   return a[data.name] - b[data.name]
            // },
            render: (val: string) => <button className="rounded-full border-2 border-rose-500 text-red-600 bg-red-100 px-5 text-center">{val}</button>,
          };
        }
        return {
          title: `${data.label}`,
          dataIndex: `${data.name}`,
          key: `${i}`,
          width: 150,
          textWrap: "word-break",
          ellipsis: true,
          // fixed: i < 1 ? "left" : undefined,
          //   sorter: (a, b) => {
          //     return a[data.name] - b[data.name]
          //   },
          render: (val: string) => val,
        };
      });

  return (
    <div className="relative overflow-x-auto">
      <Table
        dataSource={jsonData}
        // style={{ whiteSpace: 'break-spaces', height:'300px'}}
        columns={finalColumns}
        loading={loading}
        pagination={
          paginate
            ? {
                pageSize: pageSizeSelected,
                total: jsonData.length === 20 ? page * 20 + 1 : page * 20,
                current: page,
                onChange: (newPage: number) => {
                  setPage(newPage);
                },
              }
            : {
                pageSizeOptions,
                showSizeChanger: false,
                pageSize: pageSizeSelected,
                onChange: onchangePageSize,
                className: "custom-pagination",
              }
        }
      />
    </div>
  );
};

export default TableComponent;
