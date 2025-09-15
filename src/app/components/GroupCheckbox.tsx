import React from "react";
import { Checkbox } from "antd";
import type { CheckboxProps } from "antd";

type OptionType = {
  value: string;
  label: string;
};

type GroupCheckboxProps = {
  plainOptions: OptionType[];

  defaultCheckedList: string[];

  checkedList: string[];

  setCheckedList: React.Dispatch<React.SetStateAction<string[]>>;
};

const GroupCheckbox: React.FC<GroupCheckboxProps> = ({
  plainOptions,
  checkedList,
  setCheckedList,
}: GroupCheckboxProps) => {
  const onChange: CheckboxProps["onChange"] = (e) => {
    const filteredArray = checkedList?.indexOf(e.target.value as string);
    if (filteredArray === -1) {
      setCheckedList((prev) => [...prev, e.target.value as string]);
    } else {
      const updatedItems = checkedList.filter(
        (item) => item !== e.target.value
      );
      setCheckedList(updatedItems);
    }
  };

  const onCheckAllChange: CheckboxProps["onChange"] = (e) => {
    const checkedOptions = plainOptions?.map((record) => record.value);
    setCheckedList(e.target.checked ? checkedOptions : []);
  };

  return (
    <div className="flex flex-col">
      {plainOptions.map((record, index) => (
        <Checkbox
          key={index}
          checked={checkedList.includes(record?.value)}
          value={record?.value}
          onChange={onChange}
          className="mb-14"
        >
          {record?.label}
        </Checkbox>
      ))}
      <Checkbox value={""} checked={checkedList?.length <= 4  ? false : true} indeterminate={checkedList?.length <= 4 ? true : false} onChange={onCheckAllChange}>
        Compare All
      </Checkbox>
    </div>
  );
};

export default GroupCheckbox;
