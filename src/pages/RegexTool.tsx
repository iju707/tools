import React, { useState, useMemo } from 'react';
import regexpTree from 'regexp-tree';

export default function RegexTool() {
  const [pattern, setPattern] = useState('[0-9]+');
  const [flags, setFlags] = useState('g');
  const [sampleText, setSampleText] = useState('There are 3 apples and 12 bananas.');
  
  // Try to parse the AST dynamically to show errors
  const parseResult = useMemo(() => {
    try {
      if (!pattern) return { ast: null, error: null };
      const ast = regexpTree.parse(`/${pattern}/${flags}`);
      return { ast, error: null };
    } catch (e: any) {
      return { ast: null, error: e.message };
    }
  }, [pattern, flags]);

  // Execute matching
  const matchResult = useMemo(() => {
    try {
      if (!pattern || parseResult.error) return { matches: [], error: null };
      const regex = new RegExp(pattern, flags);
      const matches: any[] = [];
      let match;

      const extractGroups = (m: RegExpExecArray) => {
        const groups = [];
        for (let i = 1; i < m.length; i++) {
          groups.push({ index: i, value: m[i] });
        }
        return { groups, namedGroups: m.groups || null };
      };

      if (regex.global) {
        while ((match = regex.exec(sampleText)) !== null) {
          if (match[0].length === 0) {
            regex.lastIndex++; // Prevent infinite loop on zero-length matches
          } else {
             const { groups, namedGroups } = extractGroups(match);
             matches.push({ start: match.index, end: match.index + match[0].length, text: match[0], groups, namedGroups });
          }
        }
      } else {
        match = regex.exec(sampleText);
        if (match) {
          const { groups, namedGroups } = extractGroups(match);
          matches.push({ start: match.index, end: match.index + match[0].length, text: match[0], groups, namedGroups });
        }
      }
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [pattern, flags, sampleText, parseResult.error]);

  const renderHighlight = () => {
    if (!sampleText) return null;
    if (matchResult.matches.length === 0) return <span>{sampleText}</span>;

    const elements = [];
    let lastIndex = 0;
    
    matchResult.matches.forEach((m, idx) => {
      // Add unhighlighted text before the match
      if (m.start > lastIndex) {
        elements.push(<span key={`text-${idx}`}>{sampleText.slice(lastIndex, m.start)}</span>);
      }
      // Add highlighted text
      elements.push(
        <span key={`match-${idx}`} className="bg-blue-200 text-blue-900 rounded px-0.5 border border-blue-300 font-medium shadow-sm">
          {sampleText.slice(m.start, m.end)}
        </span>
      );
      lastIndex = m.end;
    });

    // Add remaining unhighlighted text
    if (lastIndex < sampleText.length) {
      elements.push(<span key="text-end">{sampleText.slice(lastIndex)}</span>);
    }

    return elements;
  };

  const renderAstNode = (node: any, depth = 0): React.ReactNode => {
    if (!node) return null;
    const padding = { paddingLeft: `${depth * 16}px` };

    if (node.type === 'RegExp') {
      return (
        <div className="space-y-1">
          <div className="font-semibold text-blue-700">RegExp</div>
          {node.body && renderAstNode(node.body, depth + 1)}
        </div>
      );
    }

    if (node.type === 'Char') {
      return <div style={padding} className="text-gray-600 py-0.5">↳ Char: <span className="font-mono bg-gray-100 px-1 rounded border border-gray-200">{node.value}</span></div>;
    }
    
    if (node.type === 'Repetition') {
       return (
         <div style={padding} className="text-purple-600 py-0.5">
           <span className="font-semibold">↳ Repetition</span> <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded ml-1">{node.quantifier.kind}</span>
           {renderAstNode(node.expression, depth + 1)}
         </div>
       );
    }

    if (node.type === 'Alternative') {
       return (
         <div style={padding} className="text-orange-600 py-0.5">
           <span className="font-semibold">↳ Alternative</span>
           {node.expressions.map((exp: any, i: number) => (
             <div key={i}>{renderAstNode(exp, depth + 1)}</div>
           ))}
         </div>
       );
    }

    if (node.type === 'CharClass') {
       return (
         <div style={padding} className="text-teal-600 py-0.5">
           <span className="font-semibold">↳ CharClass</span> {node.negative ? <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded ml-1">Negative</span> : ''}
           {node.expressions.map((exp: any, i: number) => (
             <div key={i}>{renderAstNode(exp, depth + 1)}</div>
           ))}
         </div>
       );
    }
    
    if (node.type === 'Group') {
       return (
         <div style={padding} className="text-indigo-600 py-0.5">
           <span className="font-semibold">↳ Group</span> <span className="text-xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded ml-1">{node.capturing ? 'Capturing' : 'Non-capturing'}</span>
           {node.expression && renderAstNode(node.expression, depth + 1)}
         </div>
       );
    }

    if (node.type === 'ClassRange') {
       return (
         <div style={padding} className="text-pink-600 py-0.5">
           <span className="font-semibold">↳ Range</span> <span className="text-sm">({node.from.value} - {node.to.value})</span>
         </div>
       );
    }

    // Fallback for other nodes
    return <div style={padding} className="text-gray-500 py-0.5">↳ {node.type}</div>;
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Top Input Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 shrink-0 transition-shadow hover:shadow-md">
        <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Regular Expression</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <span className="px-4 text-gray-400 font-mono text-xl select-none">/</span>
            <input 
              type="text" 
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              className="flex-1 bg-transparent py-4 outline-none font-mono text-lg text-gray-900"
              placeholder="Enter regex pattern..."
              autoFocus
            />
            <span className="px-2 text-gray-400 font-mono text-xl select-none">/</span>
            <input 
              type="text" 
              value={flags}
              onChange={e => setFlags(e.target.value)}
              className="w-20 bg-transparent py-4 outline-none font-mono text-lg text-blue-600 text-center"
              placeholder="flags"
            />
          </div>
          <button 
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all whitespace-nowrap active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run Pattern
          </button>
        </div>
        {parseResult.error && (
          <div className="mt-3 text-sm text-red-600 font-mono bg-red-50 p-3 rounded-md border border-red-100 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {parseResult.error}
          </div>
        )}
      </div>

      {/* Bottom Split View */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left: Regex Analyzer */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/80 shrink-0 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <h3 className="font-bold text-gray-800">AST Analyzer</h3>
          </div>
          <div className="flex-1 p-5 overflow-auto font-mono text-sm leading-relaxed bg-white">
            {parseResult.ast ? renderAstNode(parseResult.ast) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="italic">No valid regex to analyze.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sample Data & Highlight */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4 min-h-0">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative hover:shadow-md transition-shadow">
             <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/80 shrink-0 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-bold text-gray-800">Test String & Matches</h3>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full shadow-sm">
                {matchResult.matches.length} match{matchResult.matches.length !== 1 ? 'es' : ''}
              </span>
            </div>
             <div className="flex-1 flex flex-col divide-y divide-gray-100">
               {/* Input Textarea */}
               <div className="flex-1 flex relative">
                 <textarea 
                    className="absolute inset-0 w-full h-full resize-none p-5 outline-none text-gray-700 font-mono text-base bg-white focus:bg-gray-50/30 transition-colors"
                    value={sampleText}
                    onChange={e => setSampleText(e.target.value)}
                    placeholder="Enter test string here..."
                    spellCheck={false}
                 />
               </div>
               
               {/* Output Highlight Area */}
               <div className="flex-1 p-5 bg-gray-50 font-mono text-base whitespace-pre-wrap overflow-auto text-gray-600 relative border-b border-gray-100">
                  <div className="absolute top-0 right-0 p-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded shadow-sm border border-gray-100">Preview</span>
                  </div>
                  <div className="pt-2">{renderHighlight()}</div>
               </div>
               
               {/* Match Details Area */}
               <div className="flex-1 p-5 bg-white overflow-auto relative">
                  <div className="absolute top-0 right-0 p-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded shadow-sm border border-gray-200">Match Details</span>
                  </div>
                  <div className="pt-2 space-y-4">
                    {matchResult.matches.length === 0 ? (
                      <div className="text-gray-400 text-sm italic">No matches found.</div>
                    ) : (
                      matchResult.matches.map((m: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <div className="bg-blue-50/50 px-4 py-2 border-b border-gray-200 font-mono text-sm text-blue-900">
                            <span className="font-bold mr-2">Match {idx + 1}:</span>
                            <span className="bg-white px-1 py-0.5 rounded border border-blue-200">{m.text}</span>
                          </div>
                          {(m.groups.length > 0 || m.namedGroups) && (
                            <div className="p-3 bg-white font-mono text-sm space-y-2">
                              {m.groups.map((g: any) => (
                                <div key={g.index} className="flex items-center gap-2">
                                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Group {g.index}</span>
                                  <span className="text-gray-800">{g.value !== undefined ? g.value : <span className="text-gray-400 italic">undefined</span>}</span>
                                </div>
                              ))}
                              {m.namedGroups && Object.entries(m.namedGroups).map(([name, value], i) => (
                                <div key={`named-${i}`} className="flex items-center gap-2">
                                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Name: {name}</span>
                                  <span className="text-gray-800">{value !== undefined ? String(value) : <span className="text-gray-400 italic">undefined</span>}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
