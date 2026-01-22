import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import FormulaText from './FormulaText';
import { FunctionSquare, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Common math symbols organized by category
const SYMBOLS = {
  basic: [
    { label: '+', latex: '+' },
    { label: '−', latex: '-' },
    { label: '×', latex: '\\times' },
    { label: '÷', latex: '\\div' },
    { label: '±', latex: '\\pm' },
    { label: '=', latex: '=' },
    { label: '≠', latex: '\\neq' },
    { label: '<', latex: '<' },
    { label: '>', latex: '>' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' },
    { label: '≈', latex: '\\approx' },
  ],
  fractions: [
    { label: 'a/b', latex: '\\frac{a}{b}', cursor: 6 },
    { label: '√', latex: '\\sqrt{x}', cursor: 6 },
    { label: '∛', latex: '\\sqrt[3]{x}', cursor: 9 },
    { label: 'ⁿ√', latex: '\\sqrt[n]{x}', cursor: 6 },
  ],
  powers: [
    { label: 'x²', latex: 'x^{2}', cursor: 2 },
    { label: 'x³', latex: 'x^{3}', cursor: 2 },
    { label: 'xⁿ', latex: 'x^{n}', cursor: 2 },
    { label: 'xₙ', latex: 'x_{n}', cursor: 2 },
    { label: 'eˣ', latex: 'e^{x}', cursor: 3 },
    { label: '10ˣ', latex: '10^{x}', cursor: 4 },
  ],
  greek: [
    { label: 'α', latex: '\\alpha' },
    { label: 'β', latex: '\\beta' },
    { label: 'γ', latex: '\\gamma' },
    { label: 'δ', latex: '\\delta' },
    { label: 'θ', latex: '\\theta' },
    { label: 'λ', latex: '\\lambda' },
    { label: 'μ', latex: '\\mu' },
    { label: 'π', latex: '\\pi' },
    { label: 'σ', latex: '\\sigma' },
    { label: 'φ', latex: '\\phi' },
    { label: 'ω', latex: '\\omega' },
    { label: 'Δ', latex: '\\Delta' },
    { label: 'Σ', latex: '\\Sigma' },
    { label: 'Ω', latex: '\\Omega' },
  ],
  trig: [
    { label: 'sin', latex: '\\sin(x)', cursor: 5 },
    { label: 'cos', latex: '\\cos(x)', cursor: 5 },
    { label: 'tan', latex: '\\tan(x)', cursor: 5 },
    { label: 'sin⁻¹', latex: '\\arcsin(x)', cursor: 8 },
    { label: 'cos⁻¹', latex: '\\arccos(x)', cursor: 8 },
    { label: 'tan⁻¹', latex: '\\arctan(x)', cursor: 8 },
  ],
  calculus: [
    { label: '∫', latex: '\\int_{a}^{b}', cursor: 5 },
    { label: '∑', latex: '\\sum_{i=1}^{n}', cursor: 5 },
    { label: '∏', latex: '\\prod_{i=1}^{n}', cursor: 6 },
    { label: '∂', latex: '\\partial' },
    { label: '∞', latex: '\\infty' },
    { label: 'lim', latex: '\\lim_{x \\to a}', cursor: 5 },
    { label: 'dx', latex: '\\frac{d}{dx}', cursor: 10 },
  ],
  chemistry: [
    { label: '→', latex: '\\rightarrow' },
    { label: '⇌', latex: '\\rightleftharpoons' },
    { label: 'H₂O', latex: 'H_2O' },
    { label: 'CO₂', latex: 'CO_2' },
    { label: '°C', latex: '^{\\circ}C' },
  ],
  physics: [
    { label: '⃗', latex: '\\vec{v}', cursor: 5 },
    { label: 'Δ', latex: '\\Delta' },
    { label: '∇', latex: '\\nabla' },
    { label: 'ℏ', latex: '\\hbar' },
  ],
};

// Quick symbols for inline toolbar
const QUICK_SYMBOLS = [
  { label: 'x²', latex: '^{2}' },
  { label: '√', latex: '\\sqrt{}', cursor: 6 },
  { label: 'π', latex: '\\pi' },
  { label: '÷', latex: '\\div' },
  { label: '×', latex: '\\times' },
  { label: 'a/b', latex: '\\frac{}{}', cursor: 6 },
  { label: 'θ', latex: '\\theta' },
  { label: '∫', latex: '\\int' },
];

/**
 * Props for the FormulaInput component.
 */
interface FormulaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  /** Use single-line input instead of textarea */
  singleLine?: boolean;
  onBlur?: () => void;
  /** Show live preview (default: true for better UX) */
  showLivePreview?: boolean;
}

/**
 * Input component with LaTeX support for mathematical formulas.
 * Includes a toolbar for common math symbols and live preview.
 * 
 * @param {FormulaInputProps} props - Component props.
 * @returns {JSX.Element} The formula input component.
 */
const FormulaInput: React.FC<FormulaInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter text with formulas (use $...$ for inline)',
  className,
  rows = 3,
  singleLine = false,
  onBlur,
  showLivePreview = true,
}) => {
  const [previewMode, setPreviewMode] = useState<'live' | 'edit' | 'preview'>(showLivePreview ? 'live' : 'edit');
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [isInFormula, setIsInFormula] = useState(false);

  // Check if cursor is inside a formula ($...$)
  const checkIfInFormula = useCallback(() => {
    const input = inputRef.current;
    if (!input) return false;

    const cursorPos = input.selectionStart || 0;
    const beforeCursor = value.slice(0, cursorPos);

    // Count $ signs before cursor
    const dollarCount = (beforeCursor.match(/\$/g) || []).length;
    // If odd number of $, we're inside a formula
    return dollarCount % 2 === 1;
  }, [value]);

  useEffect(() => {
    setIsInFormula(checkIfInFormula());
  }, [value, checkIfInFormula]);

  const insertSymbol = useCallback((latex: string, cursorOffset?: number) => {
    const input = inputRef.current;
    if (!input) {
      // If not in formula context, wrap with $
      if (!isInFormula) {
        onChange(value + `$${latex}$`);
      } else {
        onChange(value + latex);
      }
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    // Check if we're inside a formula
    const beforeCursor = value.slice(0, start);
    const dollarCount = (beforeCursor.match(/\$/g) || []).length;
    const inFormula = dollarCount % 2 === 1;

    let insertText = latex;
    let newCursorOffset = cursorOffset;

    // If not in formula, wrap the symbol with $...$
    if (!inFormula) {
      insertText = `$${latex}$`;
      newCursorOffset = cursorOffset ? cursorOffset + 1 : latex.length + 1;
    }

    const newValue = value.slice(0, start) + insertText + value.slice(end);
    onChange(newValue);

    // Set cursor position after insert
    requestAnimationFrame(() => {
      const newPos = newCursorOffset ? start + newCursorOffset : start + insertText.length;
      input.setSelectionRange(newPos, newPos);
      input.focus();
    });
  }, [value, onChange, isInFormula]);

  const startFormula = useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      onChange(value + '$$');
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selectedText = value.slice(start, end);

    let newValue: string;
    let cursorPos: number;

    if (selectedText) {
      // Wrap selection
      newValue = value.slice(0, start) + '$' + selectedText + '$' + value.slice(end);
      cursorPos = start + 1 + selectedText.length;
    } else {
      // Insert $$ and place cursor in between
      newValue = value.slice(0, start) + '$$' + value.slice(end);
      cursorPos = start + 1;
    }

    onChange(newValue);

    requestAnimationFrame(() => {
      input.setSelectionRange(cursorPos, cursorPos);
      input.focus();
    });
  }, [value, onChange]);

  // Detect if value contains any LaTeX
  const hasFormulas = value.includes('$');

  return (
    <div className={cn('space-y-2', className)}>
      {/* Compact toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Quick symbols - always visible for fast insertion */}
        <div className="flex items-center gap-0.5 p-1 bg-muted rounded-md">
          {QUICK_SYMBOLS.map((sym) => (
            <Button
              key={sym.latex}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-xs font-mono hover:bg-background"
              onClick={() => insertSymbol(sym.latex, sym.cursor)}
              title={`Insert ${sym.label}`}
            >
              {sym.label}
            </Button>
          ))}
        </div>

        {/* Start formula button */}
        <Button
          type="button"
          variant={isInFormula ? "secondary" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={startFormula}
        >
          <FunctionSquare className="h-3 w-3" />
          {isInFormula ? 'In Formula' : 'Start $'}
        </Button>

        {/* More symbols popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs">
              More...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full flex-wrap h-auto gap-0.5 bg-transparent p-0 mb-2">
                {Object.keys(SYMBOLS).map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs px-2 py-1 h-6 capitalize">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(SYMBOLS).map(([category, symbols]) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <ScrollArea className="h-28">
                    <div className="grid grid-cols-4 gap-0.5">
                      {symbols.map((sym) => (
                        <Button
                          key={sym.latex}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-sm font-mono hover:bg-primary/10"
                          onClick={() => insertSymbol(sym.latex, sym.cursor)}
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

        {/* Preview toggle */}
        {hasFormulas && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 ml-auto"
            onClick={() => setPreviewMode(prev => prev === 'preview' ? 'edit' : 'preview')}
          >
            {previewMode === 'preview' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {previewMode === 'preview' ? 'Edit' : 'Preview'}
          </Button>
        )}
      </div>

      {/* Input/Preview area */}
      {previewMode === 'preview' ? (
        <div className="min-h-[60px] p-3 rounded-md border bg-muted/30">
          {value ? (
            <FormulaText text={value} />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {singleLine ? (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              onBlur={onBlur}
              onClick={() => setIsInFormula(checkIfInFormula())}
              onKeyUp={() => setIsInFormula(checkIfInFormula())}
              className={cn(isInFormula && 'ring-2 ring-primary/50')}
            />
          ) : (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              onBlur={onBlur}
              onClick={() => setIsInFormula(checkIfInFormula())}
              onKeyUp={() => setIsInFormula(checkIfInFormula())}
              className={cn(isInFormula && 'ring-2 ring-primary/50')}
            />
          )}

          {/* Live preview below input when there are formulas */}
          {showLivePreview && hasFormulas && previewMode === 'live' && (
            <div className="p-2 rounded-md border border-dashed bg-muted/20 text-sm">
              <span className="text-xs text-muted-foreground block mb-1">Preview:</span>
              <FormulaText text={value} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormulaInput;
