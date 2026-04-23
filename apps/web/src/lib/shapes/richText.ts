export type Span = { text: string; bold: boolean; italic: boolean };

// Minimal inline-markdown tokenizer: **bold**, *italic*, `code`.
// Nesting isn't supported — first pass is good enough for whiteboard labels.
export function parseInline(line: string): Span[] {
  const out: Span[] = [];
  let i = 0;
  let cur = "";
  let bold = false;
  let italic = false;

  const flush = () => {
    if (cur) out.push({ text: cur, bold, italic });
    cur = "";
  };

  while (i < line.length) {
    if (line.startsWith("**", i)) {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (line[i] === "*") {
      flush();
      italic = !italic;
      i += 1;
      continue;
    }
    cur += line[i];
    i++;
  }
  flush();
  return out;
}

export function fontFor(base: number, family: string, bold: boolean, italic: boolean): string {
  const weight = bold ? "bold" : "normal";
  const style = italic ? "italic" : "normal";
  return `${style} ${weight} ${base}px ${family}`;
}

export function drawMarkdownLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  fontSize: number,
  fontFamily: string,
  x: number,
  y: number,
  lineHeight = 1.2,
) {
  lines.forEach((line, row) => {
    const spans = parseInline(line);
    let cursorX = x;
    const cursorY = y + row * fontSize * lineHeight;
    for (const span of spans) {
      ctx.font = fontFor(fontSize, fontFamily, span.bold, span.italic);
      ctx.fillText(span.text, cursorX, cursorY);
      cursorX += ctx.measureText(span.text).width;
    }
  });
}

export function toSvgTspans(line: string): string {
  const spans = parseInline(line);
  return spans
    .map((s) => {
      const weight = s.bold ? ' font-weight="bold"' : "";
      const style = s.italic ? ' font-style="italic"' : "";
      const esc = s.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<tspan${weight}${style}>${esc}</tspan>`;
    })
    .join("");
}
