import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie';
  data: ChartData[];
  title?: string;
  showLegend?: boolean;
  colors?: string[];
}

interface ChartElementProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  isEditing?: boolean;
}

const DEFAULT_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#f97316'
];

export const ChartElement = ({ config, onConfigChange, isEditing = false }: ChartElementProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [localData, setLocalData] = useState<ChartData[]>(config.data);
  const [chartType, setChartType] = useState<ChartConfig['type']>(config.type);

  const handleAddDataPoint = () => {
    const newData = [...localData, { name: `Item ${localData.length + 1}`, value: 50 }];
    setLocalData(newData);
  };

  const handleRemoveDataPoint = (index: number) => {
    const newData = localData.filter((_, i) => i !== index);
    setLocalData(newData);
  };

  const handleDataChange = (index: number, field: 'name' | 'value', value: string) => {
    const newData = [...localData];
    if (field === 'value') {
      newData[index] = { ...newData[index], value: Number(value) };
    } else {
      newData[index] = { ...newData[index], name: value };
    }
    setLocalData(newData);
  };

  const handleSave = () => {
    onConfigChange({ ...config, type: chartType, data: localData });
    setEditDialogOpen(false);
  };

  const renderChart = () => {
    const dataWithColors = config.data.map((item, index) => ({
      ...item,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }));

    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataWithColors} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataWithColors} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={DEFAULT_COLORS[0]} 
                strokeWidth={2}
                dot={{ fill: DEFAULT_COLORS[0], r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithColors}
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="70%"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ strokeWidth: 1 }}
              >
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="w-full h-full relative">
      {renderChart()}
      
      {isEditing && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="secondary" 
              className="absolute top-2 right-2 z-10 opacity-70 hover:opacity-100"
            >
              Edit Data
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Chart Data</DialogTitle>
            </DialogHeader>
            
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartConfig['type'])}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="bar">Bar</TabsTrigger>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="pie">Pie</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20">
              {localData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => handleDataChange(index, 'name', e.target.value)}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.value}
                    onChange={(e) => handleDataChange(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="w-24"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveDataPoint(index)}
                    disabled={localData.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleAddDataPoint}>
                <Plus className="w-4 h-4 mr-2" />
                Add Data Point
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ChartElement;
