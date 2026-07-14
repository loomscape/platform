import React from "react";

/**
 * A lightweight, reliable Markdown renderer for the dual-README specifications.
 * Safely parses structural headers, lists, code blocks, and bold texts into styled JSX.
 */
export function renderMarkdown(markdown: string): React.ReactNode {
  if (!markdown) return null;

  const lines = markdown.split("\n");
  const elements: React.JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";

  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = (key: string) => {
    if (listItems.length > 0 && listType) {
      if (listType === "ul") {
        elements.push(
          <ul key={`list-${key}`} className="list-disc ml-6 my-3 text-sm text-gray-700 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlineStyles(item) }} />
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${key}`} className="list-decimal ml-6 my-3 text-sm text-gray-700 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlineStyles(item) }} />
            ))}
          </ol>
        );
      }
      listItems = [];
      listType = null;
    }
  };

  const parseInlineStyles = (text: string): string => {
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // Code `code`
    html = html.replace(/`(.*?)`/g, "<code class='bg-amber-100/50 text-amber-800 px-1 py-0.5 rounded text-xs font-mono'>$1</code>");
    
    return html;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code block
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${i}`} className="bg-stone-900 text-stone-100 p-4 rounded-lg my-3 font-mono text-xs overflow-x-auto border border-stone-800 leading-relaxed">
            {codeBlockLang && <div className="text-[10px] text-stone-400 font-sans uppercase tracking-widest border-b border-stone-800 pb-2 mb-2">{codeBlockLang}</div>}
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        codeBlockLang = "";
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLang = line.replace("```", "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Handle Lists
    const isUnordered = line.trim().startsWith("* ") || line.trim().startsWith("- ");
    const isOrdered = /^\d+\.\s/.test(line.trim());

    if (isUnordered || isOrdered) {
      const type = isUnordered ? "ul" : "ol";
      if (listType && listType !== type) {
        flushList(`flush-${i}`);
      }
      listType = type;
      const content = isUnordered 
        ? line.trim().substring(2) 
        : line.trim().replace(/^\d+\.\s/, "");
      listItems.push(content);
      continue;
    } else {
      flushList(`end-${i}`);
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(<h1 key={`h1-${i}`} className="text-xl md:text-2xl font-bold font-sans text-stone-900 border-b border-stone-200 pb-2 mt-6 mb-3 tracking-tight">{line.substring(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={`h2-${i}`} className="text-lg md:text-xl font-bold font-sans text-stone-900 mt-5 mb-2.5 tracking-tight border-l-2 border-amber-600 pl-3">{line.substring(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={`h3-${i}`} className="text-base md:text-lg font-bold font-sans text-stone-800 mt-4 mb-2">{line.substring(4)}</h3>);
    } else if (line.trim() === "") {
      // Empty line
      elements.push(<div key={`space-${i}`} className="h-2" />);
    } else {
      // Normal paragraph
      elements.push(
        <p key={`p-${i}`} className="text-sm md:text-base text-stone-700 leading-relaxed my-2 text-justify" dangerouslySetInnerHTML={{ __html: parseInlineStyles(line) }} />
      );
    }
  }

  // Flush remaining list items if any
  flushList("final");

  return <div className="space-y-1">{elements}</div>;
}
