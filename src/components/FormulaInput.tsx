import React, { useState, useRef } from 'react';
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

interface FormulaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  /** Use single-line input instead of textarea */
  singleLine?: boolean;
  onBlur?: () => void;
}

const FormulaInput: React.FC<FormulaInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter text with formulas (use $...$ for inline, $$...$$ for block)',
  className,
  rows = 3,
  singleLine = false,
  onBlur,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const insertSymbol = (latex: string, cursorOffset?: number) => {
    const input = inputRef.current;
    if (!input) {
      onChange(value + latex);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = value.slice(0, start) + latex + value.slice(end);
    onChange(newValue);

    // Set cursor position after insert
    requestAnimationFrame(() => {
      const newPos = cursorOffset ? start + cursorOffset : start + latex.length;
      input.setSelectionRange(newPos, newPos);
      input.focus();
    });
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selectedText = value.slice(start, end);
    const newValue = value.slice(0, start) + prefix + selectedText + suffix + value.slice(end);
    onChange(newValue);

    requestAnimationFrame(() => {
      const newPos = start + prefix.length + selectedText.length;
      input.setSelectionRange(newPos, newPos);
      input.focus();
    });
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1">
              <FunctionSquare className="h-4 w-4" />
              Insert Formula
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0">
                <TabsTrigger value="basic" className="text-xs px-2 py-1 h-7">Basic</TabsTrigger>
                <TabsTrigger value="fractions" className="text-xs px-2 py-1 h-7">Fractions</TabsTrigger>
                <TabsTrigger value="powers" className="text-xs px-2 py-1 h-7">Powers</TabsTrigger>
                <TabsTrigger value="greek" className="text-xs px-2 py-1 h-7">Greek</TabsTrigger>
                <TabsTrigger value="trig" className="text-xs px-2 py-1 h-7">Trig</TabsTrigger>
                <TabsTrigger value="calculus" className="text-xs px-2 py-1 h-7">Calculus</TabsTrigger>
                <TabsTrigger value="chemistry" className="text-xs px-2 py-1 h-7">Chem</TabsTrigger>
                <TabsTrigger value="physics" className="text-xs px-2 py-1 h-7">Physics</TabsTrigger>
              </TabsList>
              {Object.entries(SYMBOLS).map(([category, symbols]) => (
                <TabsContent key={category} value={category} className="mt-2">
                  <ScrollArea className="h-32">
                    <div className="grid grid-cols-4 gap-1">
                      {symbols.map((sym) => (
                        <Button
                          key={sym.latex}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-sm font-mono"
                          onClick={() => insertSymbol(`$${sym.latex}$`, sym.cursor ? sym.cursor + 1 : undefined)}
                        >
                          {sym.label}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
            <div className="mt-2 pt-2 border-t space-y-1">
              <p className="text-xs text-muted-foreground">Quick wrap:</p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => wrapSelection('$', '$')}
                >
                  Inline $...$
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => wrapSelection('$$', '$$')}
                >
                  Block $$...$$
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Edit' : 'Preview'}
        </Button>

        <span className="text-xs text-muted-foreground ml-auto">
          Use $...$ for inline, $$...$$ for block formulas
        </span>
      </div>

      {showPreview ? (
        <div className="min-h-[80px] p-3 rounded-md border bg-muted/30">
          {value ? (
            <FormulaText text={value} />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      ) : singleLine ? (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onBlur={onBlur}
        />
      ) : (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onBlur={onBlur}
        />
      )}
    </div>
  );
};

export default FormulaInput;
