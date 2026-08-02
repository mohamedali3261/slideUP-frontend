import { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

export interface CodeConfig {
  code: string;
  language: string;
  theme: 'dark' | 'light' | 'monokai' | 'github' | 'dracula' | 'nord';
  showLineNumbers: boolean;
  fontSize: number;
  highlightLines?: number[];
  showHeader?: boolean;
  headerTitle?: string;
  wrapLines?: boolean;
  tabSize?: number;
}

// Supported languages with icons (SVG paths)
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { value: 'python', label: 'Python', color: '#3776ab' },
  { value: 'java', label: 'Java', color: '#ed8b00' },
  { value: 'csharp', label: 'C#', color: '#239120' },
  { value: 'cpp', label: 'C++', color: '#00599c' },
  { value: 'go', label: 'Go', color: '#00add8' },
  { value: 'rust', label: 'Rust', color: '#dea584' },
  { value: 'php', label: 'PHP', color: '#777bb4' },
  { value: 'ruby', label: 'Ruby', color: '#cc342d' },
  { value: 'swift', label: 'Swift', color: '#fa7343' },
  { value: 'kotlin', label: 'Kotlin', color: '#7f52ff' },
  { value: 'html', label: 'HTML', color: '#e34f26' },
  { value: 'css', label: 'CSS', color: '#1572b6' },
  { value: 'sql', label: 'SQL', color: '#4479a1' },
  { value: 'bash', label: 'Bash', color: '#4eaa25' },
  { value: 'json', label: 'JSON', color: '#292929' },
  { value: 'yaml', label: 'YAML', color: '#cb171e' },
  { value: 'markdown', label: 'Markdown', color: '#083fa1' },
  { value: 'jsx', label: 'JSX', color: '#61dafb' },
  { value: 'tsx', label: 'TSX', color: '#3178c6' },
  { value: 'vue', label: 'Vue', color: '#4fc08d' },
  { value: 'graphql', label: 'GraphQL', color: '#e10098' },
  { value: 'docker', label: 'Dockerfile', color: '#2496ed' },
  { value: 'plaintext', label: 'Plain Text', color: '#666666' },
];

// Theme configurations
const THEMES = {
  dark: {
    name: 'Dark',
    background: '#1e1e1e',
    text: '#d4d4d4',
    lineNumbers: '#858585',
    highlight: 'rgba(255, 255, 0, 0.1)',
    header: '#2d2d2d',
    headerBorder: '#404040',
    keyword: '#569cd6',
    string: '#ce9178',
    comment: '#6a9955',
    number: '#b5cea8',
    function: '#dcdcaa',
    class: '#4ec9b0',
    operator: '#d4d4d4',
  },
  light: {
    name: 'Light',
    background: '#ffffff',
    text: '#333333',
    lineNumbers: '#999999',
    highlight: 'rgba(255, 255, 0, 0.2)',
    header: '#f5f5f5',
    headerBorder: '#e0e0e0',
    keyword: '#0000ff',
    string: '#a31515',
    comment: '#008000',
    number: '#098658',
    function: '#795e26',
    class: '#267f99',
    operator: '#333333',
  },
  monokai: {
    name: 'Monokai',
    background: '#272822',
    text: '#f8f8f2',
    lineNumbers: '#90908a',
    highlight: 'rgba(230, 219, 116, 0.2)',
    header: '#1e1f1c',
    headerBorder: '#3e3d32',
    keyword: '#f92672',
    string: '#e6db74',
    comment: '#75715e',
    number: '#ae81ff',
    function: '#a6e22e',
    class: '#66d9ef',
    operator: '#f8f8f2',
  },
  github: {
    name: 'GitHub',
    background: '#f6f8fa',
    text: '#24292e',
    lineNumbers: '#959da5',
    highlight: 'rgba(255, 235, 59, 0.3)',
    header: '#fafbfc',
    headerBorder: '#e1e4e8',
    keyword: '#d73a49',
    string: '#032f62',
    comment: '#6a737d',
    number: '#005cc5',
    function: '#6f42c1',
    class: '#22863a',
    operator: '#24292e',
  },
  dracula: {
    name: 'Dracula',
    background: '#282a36',
    text: '#f8f8f2',
    lineNumbers: '#6272a4',
    highlight: 'rgba(68, 71, 90, 0.5)',
    header: '#21222c',
    headerBorder: '#44475a',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    comment: '#6272a4',
    number: '#bd93f9',
    function: '#50fa7b',
    class: '#8be9fd',
    operator: '#ff79c6',
  },
  nord: {
    name: 'Nord',
    background: '#2e3440',
    text: '#d8dee9',
    lineNumbers: '#4c566a',
    highlight: 'rgba(136, 192, 208, 0.2)',
    header: '#3b4252',
    headerBorder: '#434c5e',
    keyword: '#81a1c1',
    string: '#a3be8c',
    comment: '#616e88',
    number: '#b48ead',
    function: '#88c0d0',
    class: '#8fbcbb',
    operator: '#81a1c1',
  },
};

// Syntax highlighting patterns
const getSyntaxPatterns = (theme: typeof THEMES.dark) => ({
  javascript: [
    { pattern: /(\/\/.*$)/gm, color: theme.comment },
    { pattern: /(\/\*[\s\S]*?\*\/)/g, color: theme.comment },
    { pattern: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|in|of|switch|case|break|continue|default)\b/g, color: theme.keyword },
    { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, color: theme.number },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, color: theme.string },
    { pattern: /\b(\d+\.?\d*)\b/g, color: theme.number },
    { pattern: /\b([A-Z][a-zA-Z0-9]*)\b/g, color: theme.class },
    { pattern: /\b([a-z_][a-zA-Z0-9_]*)\s*\(/g, color: theme.function },
  ],
  typescript: [
    { pattern: /(\/\/.*$)/gm, color: theme.comment },
    { pattern: /(\/\*[\s\S]*?\*\/)/g, color: theme.comment },
    { pattern: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|interface|type|enum|implements|extends|public|private|protected|readonly|abstract|declare|namespace|module)\b/g, color: theme.keyword },
    { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, color: theme.number },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, color: theme.string },
    { pattern: /\b(\d+\.?\d*)\b/g, color: theme.number },
    { pattern: /:\s*(string|number|boolean|any|void|never|unknown|object|Array|Promise)\b/g, color: theme.class },
  ],
  python: [
    { pattern: /(#.*$)/gm, color: theme.comment },
    { pattern: /("""[\s\S]*?"""|'''[\s\S]*?''')/g, color: theme.string },
    { pattern: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|lambda|yield|pass|break|continue|and|or|not|in|is|True|False|None|global|nonlocal|assert)\b/g, color: theme.keyword },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, color: theme.string },
    { pattern: /\b(\d+\.?\d*)\b/g, color: theme.number },
    { pattern: /@(\w+)/g, color: theme.function },
  ],
  html: [
    { pattern: /(&lt;!--[\s\S]*?--&gt;)/g, color: theme.comment },
    { pattern: /(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, color: theme.keyword },
    { pattern: /(\s[a-zA-Z-]+)=/g, color: theme.function },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, color: theme.string },
  ],
  css: [
    { pattern: /(\/\*[\s\S]*?\*\/)/g, color: theme.comment },
    { pattern: /([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g, color: theme.class },
    { pattern: /([a-zA-Z-]+)\s*:/g, color: theme.function },
    { pattern: /(#[0-9a-fA-F]{3,8})/g, color: theme.number },
    { pattern: /\b(\d+\.?\d*(px|em|rem|%|vh|vw|deg|s|ms)?)\b/g, color: theme.number },
  ],
  json: [
    { pattern: /("(?:[^"\\]|\\.)*")\s*:/g, color: theme.function },
    { pattern: /:\s*("(?:[^"\\]|\\.)*")/g, color: theme.string },
    { pattern: /\b(true|false|null)\b/g, color: theme.keyword },
    { pattern: /\b(-?\d+\.?\d*)\b/g, color: theme.number },
  ],
  sql: [
    { pattern: /(--.*$)/gm, color: theme.comment },
    { pattern: /\b(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET|HAVING|UNION|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|NULL|NOT|IN|LIKE|BETWEEN|EXISTS|CASE|WHEN|THEN|ELSE|END|PRIMARY|KEY|FOREIGN|REFERENCES|INDEX|UNIQUE|CONSTRAINT)\b/gi, color: theme.keyword },
    { pattern: /('(?:[^'\\]|\\.)*')/g, color: theme.string },
    { pattern: /\b(\d+\.?\d*)\b/g, color: theme.number },
  ],
  bash: [
    { pattern: /(#.*$)/gm, color: theme.comment },
    { pattern: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|export|source|alias|sudo|apt|yum|npm|yarn|pip|git)\b/g, color: theme.keyword },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, color: theme.string },
    { pattern: /(\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{[^}]+\})/g, color: theme.class },
  ],
});

// Apply syntax highlighting
const highlightCode = (code: string, language: string, theme: typeof THEMES.dark): string => {
  const patterns = getSyntaxPatterns(theme)[language as keyof ReturnType<typeof getSyntaxPatterns>] || 
                   getSyntaxPatterns(theme).javascript;
  
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  patterns.forEach(({ pattern, color }) => {
    highlighted = highlighted.replace(pattern, (match) => 
      `<span style="color:${color}">${match}</span>`
    );
  });

  return highlighted;
};

// Code templates
const CODE_TEMPLATES = {
  javascript: {
    hello: `function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');`,
    fetch: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}`,
    class: `class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return \`Hi, I'm \${this.name}\`;
  }
}`,
  },
  python: {
    hello: `def greet(name):
    print(f"Hello, {name}!")

greet("World")`,
    class: `class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        return f"Hi, I'm {self.name}"`,
    api: `import requests

def fetch_data(url):
    try:
        response = requests.get(url)
        return response.json()
    except Exception as e:
        print(f"Error: {e}")`,
  },
  typescript: {
    interface: `interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

const user: User = {
  id: 1,
  name: "John",
  email: "john@example.com",
  isActive: true
};`,
    generic: `function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("Hello");`,
  },
};

interface CodeBlockProps {
  config: CodeConfig;
  onChange: (config: CodeConfig) => void;
  width: number;
  height: number;
  isEditing?: boolean;
}

export const CodeBlock = ({
  config,
  onChange,
  width,
  height,
  isEditing = false,
}: CodeBlockProps) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCode, setEditCode] = useState(config.code);

  const theme = THEMES[config.theme];
  const lines = config.code.split('\n');
  const langInfo = LANGUAGES.find(l => l.value === config.language);

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(config.code);
    setCopied(true);
    toast.success(language === 'ar' ? 'تم النسخ!' : 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [config.code, language]);

  // Save edited code
  const handleSaveCode = () => {
    onChange({ ...config, code: editCode });
    setIsEditDialogOpen(false);
  };

  // Highlighted lines
  const highlightedLines = useMemo(() => 
    new Set(config.highlightLines || []),
    [config.highlightLines]
  );

  // Window buttons SVG
  const WindowButtons = () => (
    <svg width="52" height="12" viewBox="0 0 52 12">
      <circle cx="6" cy="6" r="5.5" fill="#ff5f56" stroke="#e0443e" strokeWidth="0.5"/>
      <circle cx="26" cy="6" r="5.5" fill="#ffbd2e" stroke="#dea123" strokeWidth="0.5"/>
      <circle cx="46" cy="6" r="5.5" fill="#27c93f" stroke="#1aab29" strokeWidth="0.5"/>
    </svg>
  );

  // Copy icon SVG
  const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );

  // Check icon SVG
  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  // Settings icon SVG
  const SettingsIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );

  return (
    <div
      className="relative rounded-lg overflow-hidden font-mono"
      style={{ width, height, backgroundColor: theme.background }}
    >
      {/* Header */}
      {config.showHeader && (
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ backgroundColor: theme.header, borderColor: theme.headerBorder }}
        >
          <div className="flex items-center gap-3">
            <WindowButtons />
            <div className="flex items-center gap-2">
              {langInfo && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: langInfo.color }}
                />
              )}
              <span className="text-xs" style={{ color: theme.lineNumbers }}>
                {config.headerTitle || langInfo?.label || config.language}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Copy Button */}
            <button
              className="p-1.5 rounded hover:bg-black/10 transition-colors"
              onClick={handleCopy}
              style={{ color: theme.lineNumbers }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>

            {/* Settings */}
            {isEditing && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="p-1.5 rounded hover:bg-black/10 transition-colors"
                    style={{ color: theme.lineNumbers }}
                  >
                    <SettingsIcon />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs">{language === 'ar' ? 'اللغة' : 'Language'}</Label>
                      <Select
                        value={config.language}
                        onValueChange={(value) => onChange({ ...config, language: value })}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                                {lang.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">{language === 'ar' ? 'السمة' : 'Theme'}</Label>
                      <Select
                        value={config.theme}
                        onValueChange={(value: CodeConfig['theme']) => onChange({ ...config, theme: value })}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(THEMES).map(([key, t]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded" style={{ backgroundColor: t.background, border: '1px solid #ccc' }} />
                                {t.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">{language === 'ar' ? 'حجم الخط' : 'Font Size'}: {config.fontSize}px</Label>
                      <Slider
                        value={[config.fontSize]}
                        onValueChange={([value]) => onChange({ ...config, fontSize: value })}
                        min={10}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{language === 'ar' ? 'أرقام الأسطر' : 'Line Numbers'}</Label>
                      <Switch
                        checked={config.showLineNumbers}
                        onCheckedChange={(checked) => onChange({ ...config, showLineNumbers: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{language === 'ar' ? 'التفاف الأسطر' : 'Wrap Lines'}</Label>
                      <Switch
                        checked={config.wrapLines}
                        onCheckedChange={(checked) => onChange({ ...config, wrapLines: checked })}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      )}

      {/* Code Content */}
      <div
        className="overflow-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20"
        style={{ height: config.showHeader ? height - 40 : height, fontSize: config.fontSize }}
        onDoubleClick={() => isEditing && setIsEditDialogOpen(true)}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: highlightedLines.has(index + 1) ? theme.highlight : 'transparent',
                }}
              >
                {config.showLineNumbers && (
                  <td
                    className="select-none text-right pr-4 pl-3"
                    style={{
                      color: theme.lineNumbers,
                      minWidth: 40,
                      verticalAlign: 'top',
                      userSelect: 'none',
                    }}
                  >
                    {index + 1}
                  </td>
                )}
                <td
                  className="pr-4"
                  style={{
                    color: theme.text,
                    whiteSpace: config.wrapLines ? 'pre-wrap' : 'pre',
                    wordBreak: config.wrapLines ? 'break-all' : 'normal',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(line || ' ', config.language, theme),
                  }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الكود' : 'Edit Code'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={language === 'ar' ? 'عنوان الملف (اختياري)' : 'File title (optional)'}
                value={config.headerTitle || ''}
                onChange={(e) => onChange({ ...config, headerTitle: e.target.value })}
                className="flex-1"
              />
              <Select
                value={config.language}
                onValueChange={(value) => onChange({ ...config, language: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              className="font-mono min-h-[300px] text-sm"
              placeholder="Enter your code here..."
              style={{ tabSize: config.tabSize }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveCode}>
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Code Block Creator
interface CodeBlockCreatorProps {
  onCreateCodeBlock: (config: CodeConfig) => void;
}

export const createDefaultCodeConfig = (): CodeConfig => ({
  code: `function hello() {
  console.log("Hello, World!");
}

hello();`,
  language: 'javascript',
  theme: 'dark',
  showLineNumbers: true,
  fontSize: 14,
  showHeader: true,
  wrapLines: false,
  tabSize: 2,
});

export const CodeBlockCreator = ({ onCreateCodeBlock }: CodeBlockCreatorProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<CodeConfig>(createDefaultCodeConfig());
  const [activeTab, setActiveTab] = useState('code');

  const handleCreate = () => {
    onCreateCodeBlock(config);
    setIsOpen(false);
    setConfig(createDefaultCodeConfig());
  };

  const applyTemplate = (lang: string, templateKey: string) => {
    const templates = CODE_TEMPLATES[lang as keyof typeof CODE_TEMPLATES];
    if (templates && templates[templateKey as keyof typeof templates]) {
      setConfig({
        ...config,
        language: lang,
        code: templates[templateKey as keyof typeof templates],
      });
    }
  };

  // Code icon SVG
  const CodeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 h-12 text-base">
          <CodeIcon />
          {language === 'ar' ? 'إضافة كود' : 'Add Code Block'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'إضافة كود' : 'Add Code Block'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="code">{language === 'ar' ? 'الكود' : 'Code'}</TabsTrigger>
            <TabsTrigger value="templates">{language === 'ar' ? 'قوالب' : 'Templates'}</TabsTrigger>
            <TabsTrigger value="style">{language === 'ar' ? 'التنسيق' : 'Style'}</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-primary/40 hover:scrollbar-thumb-primary/60 scrollbar-track-muted/20 mt-4">
            <TabsContent value="code" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'اللغة' : 'Language'}</Label>
                  <Select
                    value={config.language}
                    onValueChange={(value) => setConfig({ ...config, language: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                            {lang.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'عنوان الملف' : 'File Title'}</Label>
                  <Input
                    value={config.headerTitle || ''}
                    onChange={(e) => setConfig({ ...config, headerTitle: e.target.value })}
                    placeholder="main.js"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>{language === 'ar' ? 'الكود' : 'Code'}</Label>
                <Textarea
                  value={config.code}
                  onChange={(e) => setConfig({ ...config, code: e.target.value })}
                  className="font-mono min-h-[200px] mt-1"
                  placeholder="Enter your code here..."
                />
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'اختر قالب جاهز للبدء' : 'Choose a template to get started'}
              </p>
              
              <div className="space-y-4">
                {Object.entries(CODE_TEMPLATES).map(([lang, templates]) => (
                  <div key={lang} className="space-y-2">
                    <h4 className="font-medium capitalize">{lang}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(templates).map((key) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => applyTemplate(lang, key)}
                          className="capitalize"
                        >
                          {key}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="style" className="mt-0 space-y-4">
              <div>
                <Label>{language === 'ar' ? 'السمة' : 'Theme'}</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        config.theme === key ? 'border-primary' : 'border-transparent hover:border-muted'
                      }`}
                      onClick={() => setConfig({ ...config, theme: key as CodeConfig['theme'] })}
                    >
                      <div className="h-8 rounded" style={{ backgroundColor: t.background }}>
                        <div className="p-1 text-xs font-mono" style={{ color: t.text }}>
                          {'{ }'}
                        </div>
                      </div>
                      <p className="text-xs mt-1">{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'حجم الخط' : 'Font Size'}: {config.fontSize}px</Label>
                  <Slider
                    value={[config.fontSize]}
                    onValueChange={([value]) => setConfig({ ...config, fontSize: value })}
                    min={10}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'حجم Tab' : 'Tab Size'}: {config.tabSize}</Label>
                  <Slider
                    value={[config.tabSize]}
                    onValueChange={([value]) => setConfig({ ...config, tabSize: value })}
                    min={2}
                    max={8}
                    step={2}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{language === 'ar' ? 'أرقام الأسطر' : 'Line Numbers'}</Label>
                  <Switch
                    checked={config.showLineNumbers}
                    onCheckedChange={(checked) => setConfig({ ...config, showLineNumbers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'ar' ? 'إظهار الرأس' : 'Show Header'}</Label>
                  <Switch
                    checked={config.showHeader}
                    onCheckedChange={(checked) => setConfig({ ...config, showHeader: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'ar' ? 'التفاف الأسطر' : 'Wrap Lines'}</Label>
                  <Switch
                    checked={config.wrapLines}
                    onCheckedChange={(checked) => setConfig({ ...config, wrapLines: checked })}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Preview */}
        <div className="border-t pt-4 mt-4">
          <Label className="mb-2 block">{language === 'ar' ? 'معاينة' : 'Preview'}</Label>
          <CodeBlock config={config} onChange={setConfig} width={600} height={180} />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreate}>
            {language === 'ar' ? 'إضافة' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeBlock;
