import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';


type ChartData = {
  name: string;
  value: number;
};


interface PieChartProps {
  data: ChartData[];
  colors?: string[];
}

const PieChartComponent: React.FC<PieChartProps> = ({data, colors = []}:PieChartProps) => {
  

  const onPieEnter = (data: ChartData): void => {
    console.log(`Hovered on: ${data.name}`);
  };

  return (
    <ResponsiveContainer width={'100%'} height={200}>
      <PieChart>
        <Pie
          data={data}
          // cx="50%"
          // cy="50%"
          innerRadius={45}
          // outerRadius={100}
          fill="#8884d8"
          paddingAngle={6}
          dataKey="value"
          onMouseEnter={(data) => onPieEnter(data as ChartData)}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;