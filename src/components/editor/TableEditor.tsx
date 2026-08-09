import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Table,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Palette,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
} from 'lucide-react';
import { toast } from 'sonner';

export interface TableCell {
  content: string;
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  colSpan?: number;
  rowSpan?: number;
}

export interface TableConfig {
  rows: number;
  cols: number;
  cells: TableCell[][];
  headerRow: boolean;
  headerCol: boolean;
  borderColor: string;
  borderWidth: number;
  cellPadding: number;
  alternateRowColors?: boolean;
  alternateColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
}

interface TableEditorProps {
  config: TableConfig;
  onChange: (config: TableConfig) => void;
  width: number;
  height: number;
}

const DEFAULT_CELL: TableCell = {
  content: '',
  backgroundColor: 'transparent',
  textColor: '#000000',
  fontWeight: 'normal',
  textAlign: 'left',
  colSpan: 1,
  rowSpan: 1,
};

export const createDefaultTable = (rows: number = 3, cols: number = 3): TableConfig => ({
  rows,
  cols,
  cells: Array(rows).fill(null).map((_, rowIndex) =>
    Array(cols).fill(null).map((_, colIndex) => ({
      ...DEFAULT_CELL,
      content: rowIndex === 0 ? `Header ${colIndex + 1}` : '',
      fontWeight: rowIndex === 0 ? 'bold' : 'normal',
      textAlign: 'center',
    }))
  ),
  headerRow: true,
  headerCol: false,
  borderColor: '#e5e7eb',
  borderWidth: 1,
  cellPadding: 8,
  alternateRowColors: true,
  alternateColor: '#f9fafb',
  headerBgColor: '#f3f4f6',
  headerTextColor: '#111827',
});

// Table style presets
const TABLE_STYLES = [
  { id: 'default', name: 'Default', headerBg: '#f3f4f6', headerText: '#111827', border: '#e5e7eb', alternate: '#f9fafb' },
  { id: 'blue', name: 'Blue', headerBg: '#3b82f6', headerText: '#ffffff', border: '#93c5fd', alternate: '#eff6ff' },
  { id: 'green', name: 'Green', headerBg: '#10b981', headerText: '#ffffff', border: '#6ee7b7', alternate: '#ecfdf5' },
  { id: 'purple', name: 'Purple', headerBg: '#8b5cf6', headerText: '#ffffff', border: '#c4b5fd', alternate: '#f5f3ff' },
  { id: 'orange', name: 'Orange', headerBg: '#f97316', headerText: '#ffffff', border: '#fdba74', alternate: '#fff7ed' },
  { id: 'dark', name: 'Dark', headerBg: '#1f2937', headerText: '#ffffff', border: '#4b5563', alternate: '#f3f4f6' },
  { id: 'minimal', name: 'Minimal', headerBg: 'transparent', headerText: '#111827', border: '#e5e7eb', alternate: 'transparent' },
];

export const TableEditor = ({
  config,
  onChange,
  width,
  height,
}: TableEditorProps) => {
  const { language } = useLanguage();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  const cellHeight = height / config.rows;

  // Update cell content
  const updateCell = useCallback((row: number, col: number, updates: Partial<TableCell>) => {
    const newCells = config.cells.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c, ...updates } : c))
    );
    onChange({ ...config, cells: newCells });
  }, [config, onChange]);

  // Add row
  const addRow = useCallback((afterIndex: number) => {
    const newRow = Array(config.cols).fill(null).map(() => ({ ...DEFAULT_CELL }));
    const newCells = [
      ...config.cells.slice(0, afterIndex + 1),
      newRow,
      ...config.cells.slice(afterIndex + 1),
    ];
    onChange({ ...config, rows: config.rows + 1, cells: newCells });
  }, [config, onChange]);

  // Remove row
  const removeRow = useCallback((index: number) => {
    if (config.rows <= 1) return;
    const newCells = config.cells.filter((_, i) => i !== index);
    onChange({ ...config, rows: config.rows - 1, cells: newCells });
    setSelectedCell(null);
  }, [config, onChange]);

  // Add column
  const addColumn = useCallback((afterIndex: number) => {
    const newCells = config.cells.map(row => [
      ...row.slice(0, afterIndex + 1),
      { ...DEFAULT_CELL },
      ...row.slice(afterIndex + 1),
    ]);
    onChange({ ...config, cols: config.cols + 1, cells: newCells });
  }, [config, onChange]);

  // Remove column
  const removeColumn = useCallback((index: number) => {
    if (config.cols <= 1) return;
    const newCells = config.cells.map(row => row.filter((_, i) => i !== index));
    onChange({ ...config, cols: config.cols - 1, cells: newCells });
    setSelectedCell(null);
  }, [config, onChange]);

  // Copy row
  const copyRow = useCallback((index: number) => {
    const newRow = config.cells[index].map(cell => ({ ...cell }));
    const newCells = [
      ...config.cells.slice(0, index + 1),
      newRow,
      ...config.cells.slice(index + 1),
    ];
    onChange({ ...config, rows: config.rows + 1, cells: newCells });
    toast.success(language === 'ar' ? 'تم نسخ الصف' : 'Row copied');
  }, [config, onChange, language]);

  // Copy column
  const copyColumn = useCallback((index: number) => {
    const newCells = config.cells.map(row => [
      ...row.slice(0, index + 1),
      { ...row[index] },
      ...row.slice(index + 1),
    ]);
    onChange({ ...config, cols: config.cols + 1, cells: newCells });
    toast.success(language === 'ar' ? 'تم نسخ العمود' : 'Column copied');
  }, [config, onChange, language]);

  // Clear cell content
  // Handle cell double click to edit
  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
  };

  // Handle cell blur
  const handleCellBlur = () => {
    setEditingCell(null);
  };

  // Get cell background color
  const getCellBgColor = (rowIndex: number, colIndex: number, cell: TableCell) => {
    if (cell.backgroundColor && cell.backgroundColor !== 'transparent') {
      return cell.backgroundColor;
    }
    if (config.headerRow && rowIndex === 0) {
      return config.headerBgColor;
    }
    if (config.headerCol && colIndex === 0) {
      return config.headerBgColor;
    }
    if (config.alternateRowColors && rowIndex % 2 === 1) {
      return config.alternateColor;
    }
    return 'transparent';
  };

  // Get cell text color
  const getCellTextColor = (rowIndex: number, colIndex: number, cell: TableCell) => {
    if (cell.textColor && cell.textColor !== '#000000') {
      return cell.textColor;
    }
    if ((config.headerRow && rowIndex === 0) || (config.headerCol && colIndex === 0)) {
      return config.headerTextColor;
    }
    return '#000000';
  };

  return (
    <div className="relative" style={{ width, height }}>
      {/* Table */}
      <div
        className="w-full h-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gridTemplateRows: `repeat(${config.rows}, 1fr)`,
          border: `${config.borderWidth}px solid ${config.borderColor}`,
        }}
      >
        {config.cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                'relative overflow-hidden cursor-pointer transition-colors',
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex &&
                  'ring-2 ring-primary ring-inset'
              )}
              style={{
                backgroundColor: getCellBgColor(rowIndex, colIndex, cell),
                borderRight: colIndex < config.cols - 1 
                  ? `${config.borderWidth}px solid ${config.borderColor}` 
                  : 'none',
                borderBottom: rowIndex < config.rows - 1 
                  ? `${config.borderWidth}px solid ${config.borderColor}` 
                  : 'none',
                padding: config.cellPadding,
              }}
              onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
              onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
            >
              {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                <input
                  autoFocus
                  value={cell.content}
                  onChange={(e) => updateCell(rowIndex, colIndex, { content: e.target.value })}
                  onBlur={handleCellBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCellBlur();
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const nextCol = colIndex + 1;
                      if (nextCol < config.cols) {
                        setEditingCell({ row: rowIndex, col: nextCol });
                      } else if (rowIndex + 1 < config.rows) {
                        setEditingCell({ row: rowIndex + 1, col: 0 });
                      }
                    }
                  }}
                  className="w-full h-full bg-transparent border-none outline-none"
                  style={{
                    color: getCellTextColor(rowIndex, colIndex, cell),
                    fontWeight: cell.fontWeight,
                    textAlign: cell.textAlign,
                    fontSize: Math.min(cellHeight * 0.4, 14),
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{
                    color: getCellTextColor(rowIndex, colIndex, cell),
                    fontWeight: cell.fontWeight,
                    justifyContent: cell.textAlign === 'center' ? 'center' : 
                                   cell.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    fontSize: Math.min(cellHeight * 0.4, 14),
                  }}
                >
                  {cell.content || '\u00A0'}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Context Menu for Selected Cell */}
      {selectedCell && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 max-w-[calc(100%-1rem)] flex flex-wrap items-center justify-center gap-1 bg-card border rounded-lg p-1 shadow-lg">
          {/* Row Operations */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <ArrowUp className="w-3 h-3" />
                {language === 'ar' ? 'صف' : 'Row'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addRow(selectedCell.row - 1)}>
                <ArrowUp className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إضافة فوق' : 'Add Above'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addRow(selectedCell.row)}>
                <ArrowDown className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إضافة تحت' : 'Add Below'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyRow(selectedCell.row)}>
                <Copy className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'نسخ الصف' : 'Copy Row'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => removeRow(selectedCell.row)}
                disabled={config.rows <= 1}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'حذف الصف' : 'Delete Row'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Operations */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <ArrowLeft className="w-3 h-3" />
                {language === 'ar' ? 'عمود' : 'Col'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addColumn(selectedCell.col - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إضافة يسار' : 'Add Left'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addColumn(selectedCell.col)}>
                <ArrowRight className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إضافة يمين' : 'Add Right'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyColumn(selectedCell.col)}>
                <Copy className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'نسخ العمود' : 'Copy Column'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => removeColumn(selectedCell.col)}
                disabled={config.cols <= 1}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'حذف العمود' : 'Delete Column'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-border" />

          {/* Text Formatting */}
          <Button
            variant={config.cells[selectedCell.row][selectedCell.col].fontWeight === 'bold' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => updateCell(selectedCell.row, selectedCell.col, {
              fontWeight: config.cells[selectedCell.row][selectedCell.col].fontWeight === 'bold' ? 'normal' : 'bold'
            })}
          >
            <Bold className="w-3 h-3" />
          </Button>

          <Button
            variant={config.cells[selectedCell.row][selectedCell.col].textAlign === 'left' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => updateCell(selectedCell.row, selectedCell.col, { textAlign: 'left' })}
          >
            <AlignLeft className="w-3 h-3" />
          </Button>
          <Button
            variant={config.cells[selectedCell.row][selectedCell.col].textAlign === 'center' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => updateCell(selectedCell.row, selectedCell.col, { textAlign: 'center' })}
          >
            <AlignCenter className="w-3 h-3" />
          </Button>
          <Button
            variant={config.cells[selectedCell.row][selectedCell.col].textAlign === 'right' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => updateCell(selectedCell.row, selectedCell.col, { textAlign: 'right' })}
          >
            <AlignRight className="w-3 h-3" />
          </Button>

          <div className="w-px h-6 bg-border" />

          {/* Cell Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Palette className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{language === 'ar' ? 'لون الخلفية' : 'Background'}</Label>
                  <Input
                    type="color"
                    value={config.cells[selectedCell.row][selectedCell.col].backgroundColor || '#ffffff'}
                    onChange={(e) => updateCell(selectedCell.row, selectedCell.col, { backgroundColor: e.target.value })}
                    className="h-8 w-full"
                  />
                </div>
                <div>
                  <Label className="text-xs">{language === 'ar' ? 'لون النص' : 'Text Color'}</Label>
                  <Input
                    type="color"
                    value={config.cells[selectedCell.row][selectedCell.col].textColor || '#000000'}
                    onChange={(e) => updateCell(selectedCell.row, selectedCell.col, { textColor: e.target.value })}
                    className="h-8 w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

// Table Creation Dialog
interface TableCreatorProps {
  onCreateTable: (config: TableConfig) => void;
}

export const TableCreator = ({ onCreateTable }: TableCreatorProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [headerRow, setHeaderRow] = useState(true);
  const [alternateColors, setAlternateColors] = useState(true);

  const handleCreate = () => {
    const style = TABLE_STYLES.find(s => s.id === selectedStyle) || TABLE_STYLES[0];
    const config = createDefaultTable(rows, cols);
    config.headerRow = headerRow;
    config.alternateRowColors = alternateColors;
    config.headerBgColor = style.headerBg;
    config.headerTextColor = style.headerText;
    config.borderColor = style.border;
    config.alternateColor = style.alternate;
    
    onCreateTable(config);
    setIsOpen(false);
    setRows(3);
    setCols(3);
  };

  const handleGridSelect = (row: number, col: number) => {
    setRows(row + 1);
    setCols(col + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 h-12 text-base">
          <Table className="w-5 h-5" />
          {language === 'ar' ? 'إنشاء جدول' : 'Create Table'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'إنشاء جدول' : 'Create Table'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grid Selector */}
          <div className="flex justify-center">
            <div className="inline-grid gap-1 p-2 bg-muted rounded-lg">
              {Array(8).fill(null).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {Array(8).fill(null).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className={cn(
                        'w-6 h-6 border rounded cursor-pointer transition-colors',
                        (hoverCell && rowIndex <= hoverCell.row && colIndex <= hoverCell.col) ||
                        (rowIndex < rows && colIndex < cols)
                          ? 'bg-primary border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      )}
                      onMouseEnter={() => setHoverCell({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoverCell(null)}
                      onClick={() => handleGridSelect(rowIndex, colIndex)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Size Display */}
          <div className="text-center text-sm text-muted-foreground">
            {hoverCell ? `${hoverCell.row + 1} × ${hoverCell.col + 1}` : `${rows} × ${cols}`}
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'نمط الجدول' : 'Table Style'}</Label>
            <div className="grid grid-cols-4 gap-2">
              {TABLE_STYLES.map((style) => (
                <button
                  key={style.id}
                  className={cn(
                    'p-2 rounded border-2 transition-colors',
                    selectedStyle === style.id ? 'border-primary' : 'border-transparent hover:border-muted'
                  )}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <div className="w-full h-6 rounded-t" style={{ backgroundColor: style.headerBg }} />
                  <div className="w-full h-3" style={{ backgroundColor: style.alternate || '#fff' }} />
                  <div className="w-full h-3 border-t" style={{ borderColor: style.border }} />
                  <p className="text-xs mt-1">{style.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={headerRow} onCheckedChange={setHeaderRow} />
              <Label className="text-sm">{language === 'ar' ? 'صف رأسي' : 'Header Row'}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={alternateColors} onCheckedChange={setAlternateColors} />
              <Label className="text-sm">{language === 'ar' ? 'ألوان متناوبة' : 'Alternate Colors'}</Label>
            </div>
          </div>

          {/* Manual Input */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Label>{language === 'ar' ? 'صفوف' : 'Rows'}</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-16"
              />
            </div>
            <span>×</span>
            <div className="flex items-center gap-2">
              <Label>{language === 'ar' ? 'أعمدة' : 'Cols'}</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={cols}
                onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-16"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreate}>
            {language === 'ar' ? 'إنشاء' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableEditor;
