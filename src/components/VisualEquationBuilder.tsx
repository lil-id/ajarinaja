import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import FormulaText from './FormulaText';
import { Calculator, Eye, EyeOff, Plus, X, Divide, Minus, Equal, Superscript, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Template equations for common formulas
const TEMPLATES = [
  { label: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2' },
  { label: 'Area of Circle', latex: 'A = \\pi r^2' },
  { label: 'Slope Formula', latex: 'm = \\frac{y_2 - y_1}{x_2 - x_1}' },
  { label: 'Distance Formula', latex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}' },
  { label: 'Newton\'s 2nd Law', latex: 'F = ma' },
  { label: 'Kinetic Energy', latex: 'KE = \\frac{1}{2}mv^2' },
  { label: 'Ohm\'s Law', latex: 'V = IR' },
  { label: 'Ideal Gas Law', latex: 'PV = nRT' },
  { label: 'Einstein\'s Energy', latex: 'E = mc^2' },
];

// Visual blocks that represent formula parts
interface FormulaBlock {
  id: string;
  type: 'text' | 'fraction' | 'power' | 'sqrt' | 'symbol' | 'subscript';
  value?: string;
  numerator?: string;
  denominator?: string;
  base?: string;
  exponent?: string;
  content?: string;
  index?: string; // For nth root
}

// Quick insert buttons with visual representations
const QUICK_BUTTONS = [
  { label: '+', insert: ' + ', icon: <Plus className="h-4 w-4" /> },
  { label: '−', insert: ' - ', icon: <Minus className="h-4 w-4" /> },
  { label: '×', insert: ' \\times ', icon: <X className="h-4 w-4" /> },
  { label: '÷', insert: ' \\div ', icon: <Divide className="h-4 w-4" /> },
  { label: '=', insert: ' = ', icon: <Equal className="h-4 w-4" /> },
  { label: 'x²', insert: '^{2}', icon: <span className="text-sm font-mono">x²</span> },
];

// Symbol categories with friendly names
const SYMBOLS = {
  'Numbers & Letters': [
    { label: 'x', latex: 'x' },
    { label: 'y', latex: 'y' },
    { label: 'z', latex: 'z' },
    { label: 'a', latex: 'a' },
    { label: 'b', latex: 'b' },
    { label: 'n', latex: 'n' },
  ],
  'Greek': [
    { label: 'α', latex: '\\alpha' },
    { label: 'β', latex: '\\beta' },
    { label: 'γ', latex: '\\gamma' },
    { label: 'θ', latex: '\\theta' },
    { label: 'π', latex: '\\pi' },
    { label: 'Δ', latex: '\\Delta' },
    { label: 'Σ', latex: '\\Sigma' },
    { label: 'μ', latex: '\\mu' },
    { label: 'λ', latex: '\\lambda' },
    { label: 'ω', latex: '\\omega' },
  ],
  'Comparison': [
    { label: '<', latex: '<' },
    { label: '>', latex: '>' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' },
    { label: '≠', latex: '\\neq' },
    { label: '≈', latex: '\\approx' },
  ],
  'Calculus': [
    { label: '∫', latex: '\\int' },
    { label: '∑', latex: '\\sum' },
    { label: '∞', latex: '\\infty' },
    { label: '∂', latex: '\\partial' },
    { label: 'lim', latex: '\\lim' },
  ],
  'Functions': [
    { label: 'sin', latex: '\\sin' },
    { label: 'cos', latex: '\\cos' },
    { label: 'tan', latex: '\\tan' },
    { label: 'log', latex: '\\log' },
    { label: 'ln', latex: '\\ln' },
  ],
};

/**
 * Props for the VisualEquationBuilder component.
 */
interface VisualEquationBuilderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  singleLine?: boolean;
  onBlur?: () => void;
  compact?: boolean; // Show minimal toolbar for inline use
}

/**
 * A visual editor for building geometric and scientific equations.
 * Provides a toolbar with common math symbols, templates, and a preview.
 * 
 * @param {VisualEquationBuilderProps} props - Component props.
 * @returns {JSX.Element} The visual equation builder component.
 */
const VisualEquationBuilder: React.FC<VisualEquationBuilderProps> = ({
  value,
  onChange,
  placeholder = 'Click buttons below to build your equation, or type directly',
  className,
  rows = 3,
  singleLine = false,
  onBlur,
  compact = false,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isInMathMode, setIsInMathMode] = useState(false);

  // Insert text at cursor or end
  const insertAtCursor = useCallback((text: string) => {
    // For simplicity, append to end or insert based on if in math mode
    const newValue = value + text;
    onChange(newValue);
  }, [value, onChange]);

  // Start a formula block
  const startFormula = useCallback(() => {
    if (!value.endsWith('$') && !isInMathMode) {
      onChange(value + '$');
      setIsInMathMode(true);
    }
  }, [value, onChange, isInMathMode]);

  // End formula block
  const endFormula = useCallback(() => {
    if (isInMathMode) {
      onChange(value + '$');
      setIsInMathMode(false);
    }
  }, [value, onChange, isInMathMode]);

  // Insert a fraction
  const insertFraction = useCallback(() => {
    const latex = '\\frac{□}{□}';
    if (!isInMathMode) {
      onChange(value + '$' + latex + '$');
    } else {
      onChange(value + latex);
    }
  }, [value, onChange, isInMathMode]);

  // Insert square root
  const insertSqrt = useCallback(() => {
    const latex = '\\sqrt{□}';
    if (!isInMathMode) {
      onChange(value + '$' + latex + '$');
    } else {
      onChange(value + latex);
    }
  }, [value, onChange, isInMathMode]);

  // Insert power/exponent
  const insertPower = useCallback(() => {
    const latex = '^{□}';
    if (!isInMathMode) {
      onChange(value + '$□' + latex + '$');
    } else {
      onChange(value + latex);
    }
  }, [value, onChange, isInMathMode]);

  // Insert subscript
  const insertSubscript = useCallback(() => {
    const latex = '_{□}';
    if (!isInMathMode) {
      onChange(value + '$□' + latex + '$');
    } else {
      onChange(value + latex);
    }
  }, [value, onChange, isInMathMode]);

  // Insert template
  const insertTemplate = useCallback((latex: string) => {
    onChange(value + (value ? ' ' : '') + '$' + latex + '$');
  }, [value, onChange]);

  // Insert symbol
  const insertSymbol = useCallback((latex: string) => {
    if (!isInMathMode) {
      onChange(value + '$' + latex + '$');
    } else {
      onChange(value + latex);
    }
  }, [value, onChange, isInMathMode]);

  // Check if value has formulas
  const hasFormulas = value.includes('$');

  return (
    <div className={cn('space-y-3', className)}>
      {/* Visual Calculator-Style Toolbar */}
      <div className={cn("bg-muted/50 rounded-lg border", compact ? "p-2" : "p-3")}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground">Quick Insert:</span>
          {QUICK_BUTTONS.map((btn) => (
            <Button
              key={btn.label}
              type="button"
              variant="secondary"
              size="sm"
              className={cn(compact ? "h-7 w-7" : "h-9 w-9", "p-0")}
              onClick={() => insertSymbol(btn.insert.trim())}
              title={btn.label}
            >
              {btn.icon}
            </Button>
          ))}
        </div>

        {/* Structure buttons - Fraction, Root, Power */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground">Structures:</span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 px-3 gap-2"
              onClick={insertFraction}
            >
              <div className="flex flex-col items-center leading-none text-xs">
                <span className="border-b border-current px-1">a</span>
                <span className="px-1">b</span>
              </div>
              <span className="text-xs">Fraction</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 px-3 gap-2"
              onClick={insertSqrt}
            >
              <span className="text-lg">√</span>
              <span className="text-xs">Square Root</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 px-3 gap-2"
              onClick={insertPower}
            >
              <span className="text-sm">x<sup className="text-xs">n</sup></span>
              <span className="text-xs">Power</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 px-3 gap-2"
              onClick={insertSubscript}
            >
              <span className="text-sm">x<sub className="text-xs">n</sub></span>
              <span className="text-xs">Subscript</span>
            </Button>
          </div>
        )}

        {/* Compact mode structure buttons */}
        {compact && (
          <div className="flex flex-wrap items-center gap-1 mb-2">
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={insertFraction}>
              <span className="text-xs">a/b</span>
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={insertSqrt}>
              √
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={insertPower}>
              x<sup>n</sup>
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={insertSubscript}>
              x<sub>n</sub>
            </Button>
          </div>
        )}

        {/* Symbol categories and Templates */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbols Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1">
                <span>Symbols</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="start">
              <Tabs defaultValue="Numbers & Letters" className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-0.5 bg-transparent p-0 mb-2">
                  {Object.keys(SYMBOLS).map((cat) => (
                    <TabsTrigger key={cat} value={cat} className="text-xs px-2 py-1 h-6">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(SYMBOLS).map(([category, symbols]) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <ScrollArea className="h-24">
                      <div className="grid grid-cols-5 gap-1">
                        {symbols.map((sym) => (
                          <Button
                            key={sym.latex}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-base font-mono"
                            onClick={() => insertSymbol(sym.latex)}
                          >
                            {sym.label}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </PopoverContent>
          </Popover>

          {/* Templates Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1">
                <Calculator className="h-3 w-3" />
                <span>Templates</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <p className="text-xs text-muted-foreground mb-2">Click to insert a complete formula:</p>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {TEMPLATES.map((tmpl) => (
                    <Button
                      key={tmpl.label}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto py-2 px-3"
                      onClick={() => insertTemplate(tmpl.latex)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-medium">{tmpl.label}</span>
                        <div className="text-muted-foreground">
                          <FormulaText text={`$${tmpl.latex}$`} />
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Preview toggle */}
          {hasFormulas && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1 ml-auto"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          )}
        </div>
      </div>

      {/* Input Area */}
      {singleLine ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onBlur={onBlur}
          className="font-mono"
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onBlur={onBlur}
          className="font-mono"
        />
      )}

      {/* Inline help */}
      <p className="text-xs text-muted-foreground">
        💡 Tip: Replace □ placeholders with your values. Use $...$ to wrap math expressions.
      </p>

      {/* Preview */}
      {showPreview && hasFormulas && (
        <div className="p-3 rounded-md border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Preview:</p>
          <FormulaText text={value} />
        </div>
      )}
    </div>
  );
};

export default VisualEquationBuilder;
