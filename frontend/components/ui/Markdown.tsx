"use client";

import React from "react";

interface Props {
  text: string;
}

export default function Markdown({ text }: Props) {
  const lines = text.split("\n");
  let listItems: React.ReactNode[] = [];
  let inList = false;
  const elements: React.ReactNode[] = [];

  const parseInline = (line: string): React.ReactNode => {
    // 1. Handle bold: **bold**
    const boldParts = line.split(/\*\*([^*]+)\*\*/g);
    return (
      <>
        {boldParts.map((bp, bIdx) => {
          if (bIdx % 2 === 1) {
            return (
              <strong key={bIdx} className="font-extrabold text-white">
                {bp}
              </strong>
            );
          }
          // 2. Handle code: `code`
          const codeParts = bp.split(/`([^`]+)`/g);
          return (
            <span key={bIdx}>
              {codeParts.map((cp, cIdx) => {
                if (cIdx % 2 === 1) {
                  return (
                    <code
                      key={cIdx}
                      className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px] text-blue-300 border border-white/5"
                    >
                      {cp}
                    </code>
                  );
                }
                // 3. Handle italics: *italic*
                const italicParts = cp.split(/\*([^*]+)\*/g);
                return (
                  <span key={cIdx}>
                    {italicParts.map((ip, iIdx) => {
                      if (iIdx % 2 === 1) {
                        return (
                          <em key={iIdx} className="italic text-gray-300">
                            {ip}
                          </em>
                        );
                      }
                      return ip;
                    })}
                  </span>
                );
              })}
            </span>
          );
        })}
      </>
    );
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(
        <li key={index} className="ml-4 list-disc mb-1.5 pl-1 text-gray-200">
          {parseInline(trimmed.substring(2))}
        </li>
      );
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="my-2 space-y-1">
            {listItems}
          </ul>
        );
        inList = false;
      }

      if (trimmed.startsWith("### ")) {
        elements.push(
          <h3
            key={index}
            className="text-sm font-extrabold text-white mt-4 mb-2 flex items-center gap-1.5"
          >
            {parseInline(trimmed.substring(4))}
          </h3>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h2
            key={index}
            className="text-base font-black text-white mt-5 mb-2.5"
          >
            {parseInline(trimmed.substring(3))}
          </h2>
        );
      } else if (trimmed.startsWith("# ")) {
        elements.push(
          <h1
            key={index}
            className="text-lg font-black text-white mt-6 mb-3"
          >
            {parseInline(trimmed.substring(2))}
          </h1>
        );
      } else if (trimmed === "") {
        elements.push(<div key={index} className="h-2" />);
      } else {
        elements.push(
          <p key={index} className="mb-2 leading-relaxed text-gray-200">
            {parseInline(line)}
          </p>
        );
      }
    }
  });

  if (inList) {
    elements.push(
      <ul key="list-end" className="my-2 space-y-1">
        {listItems}
      </ul>
    );
  }

  return <>{elements}</>;
}
