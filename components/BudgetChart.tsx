
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TravelPlan } from '../types';

interface BudgetChartProps {
  plan: TravelPlan;
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

const BudgetChart: React.FC<BudgetChartProps> = ({ plan }) => {
  const categoryData = plan.itinerary.flatMap(day => day.places).reduce((acc: any, place) => {
    const cost = place.estimatedCost || 50;
    acc[0].value += cost * 0.4; // Food (Estimate)
    acc[1].value += cost * 0.3; // Activities
    acc[2].value += cost * 0.3; // Transport
    return acc;
  }, [
    { name: 'Dining', value: 0 },
    { name: 'Adventures', value: 0 },
    { name: 'Transit', value: 0 },
  ]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {categoryData.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BudgetChart;
