import React, { useState, useMemo } from 'react';
import regexpTree from 'regexp-tree';
import { 
  Box, Typography, Card, TextField, 
  Chip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TextFieldsIcon from '@mui/icons-material/TextFields';

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
        <span 
          key={`match-${idx}`} 
          style={{
            backgroundColor: '#dbeafe',
            color: '#1e3a8a',
            borderRadius: '4px',
            paddingLeft: '4px',
            paddingRight: '4px',
            paddingTop: '2px',
            paddingBottom: '2px',
            border: '1px solid #bfdbfe',
            fontWeight: 500,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
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

    if (node.type === 'RegExp') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', fontFamily: 'monospace' }}>RegExp</Typography>
          {node.body && renderAstNode(node.body, depth + 1)}
        </Box>
      );
    }

    if (node.type === 'Char') {
      return (
        <Box sx={{ pl: depth * 2, display: 'flex', alignItems: 'center', py: 0.25, color: 'text.secondary' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>↳ Char: </Typography>
          <Typography 
            variant="body2" 
            component="span" 
            sx={{ 
              fontFamily: 'monospace', 
              bgcolor: 'grey.100', 
              color: 'text.primary', 
              px: 0.75, 
              py: 0.1, 
              borderRadius: 0.5, 
              border: '1px solid', 
              borderColor: 'grey.300', 
              ml: 0.5, 
              fontSize: '0.8125rem' 
            }}
          >
            {node.value}
          </Typography>
        </Box>
      );
    }
    
    if (node.type === 'Repetition') {
       return (
         <Box sx={{ pl: depth * 2, py: 0.25 }}>
           <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', color: 'secondary.main', fontFamily: 'monospace' }}>↳ Repetition</Typography>
           <Chip 
             label={node.quantifier.kind} 
             size="small" 
             sx={{ 
               height: 18, 
               fontSize: '0.6875rem', 
               bgcolor: 'secondary.light', 
               color: 'secondary.dark', 
               ml: 1, 
               fontWeight: 'bold',
               py: 0
             }} 
           />
           {renderAstNode(node.expression, depth + 1)}
         </Box>
       );
    }

    if (node.type === 'Alternative') {
       return (
         <Box sx={{ pl: depth * 2, py: 0.25 }}>
           <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main', fontFamily: 'monospace' }}>↳ Alternative</Typography>
           {node.expressions.map((exp: any, i: number) => (
             <Box key={i}>{renderAstNode(exp, depth + 1)}</Box>
           ))}
         </Box>
       );
    }

    if (node.type === 'CharClass') {
       return (
         <Box sx={{ pl: depth * 2, py: 0.25 }}>
           <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', color: 'info.main', fontFamily: 'monospace' }}>↳ CharClass</Typography>
           {node.negative && (
             <Chip label="Negative" size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: '0.6875rem', ml: 1, fontWeight: 'bold' }} />
           )}
           {node.expressions.map((exp: any, i: number) => (
             <Box key={i}>{renderAstNode(exp, depth + 1)}</Box>
           ))}
         </Box>
       );
    }
    
    if (node.type === 'Group') {
       return (
         <Box sx={{ pl: depth * 2, py: 0.25 }}>
           <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', color: '#4f46e5', fontFamily: 'monospace' }}>↳ Group</Typography>
           <Chip 
             label={node.capturing ? 'Capturing' : 'Non-capturing'} 
             size="small" 
             variant="outlined" 
             color="primary" 
             sx={{ height: 18, fontSize: '0.6875rem', ml: 1, fontWeight: 'bold' }} 
           />
           {node.expression && renderAstNode(node.expression, depth + 1)}
         </Box>
       );
    }

    if (node.type === 'ClassRange') {
       return (
         <Box sx={{ pl: depth * 2, py: 0.25, display: 'flex', alignItems: 'center', color: 'error.main' }}>
           <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>↳ Range: </Typography>
           <Typography variant="body2" sx={{ fontFamily: 'monospace', ml: 0.5, color: 'text.primary' }}>
             ({node.from.value} - {node.to.value})
           </Typography>
         </Box>
       );
    }

    // Fallback for other nodes
    return (
      <Box sx={{ pl: depth * 2, py: 0.25 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>↳ {node.type}</Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Regex Tester
        </Typography>
      </Box>

      {/* Top Input Area */}
      <Card variant="outlined" sx={{ p: 2.5, mb: 2, bgcolor: 'white', shrink: 0 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Regular Expression
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: 'grey.50', 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: 2, 
            px: 2,
            width: '100%',
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.5)',
              bgcolor: 'white'
            },
            transition: 'all 0.2s'
          }}>
            <Typography variant="h5" color="text.secondary" sx={{ fontFamily: 'monospace', select: 'none', mr: 1, fontWeight: 'medium' }}>/</Typography>
            <TextField
              variant="standard"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="Enter regex pattern..."
              autoFocus
              slotProps={{
                input: {
                  disableUnderline: true,
                  sx: { 
                    fontFamily: 'monospace', 
                    fontSize: '1.0625rem',
                    py: 1.2
                  }
                }
              }}
              sx={{ flex: 1 }}
            />
            <Typography variant="h5" color="text.secondary" sx={{ fontFamily: 'monospace', select: 'none', mx: 1, fontWeight: 'medium' }}>/</Typography>
            <TextField
              variant="standard"
              value={flags}
              onChange={e => setFlags(e.target.value)}
              placeholder="flags"
              slotProps={{
                input: {
                  disableUnderline: true,
                  sx: { 
                    fontFamily: 'monospace', 
                    fontSize: '1.0625rem', 
                    color: 'primary.main', 
                    textAlign: 'center',
                    width: 50,
                    py: 1.2
                  }
                }
              }}
            />
          </Box>
        </Box>
        {parseResult.error && (
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.100', borderRadius: 1.5, color: 'error.main', fontFamily: 'monospace', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {parseResult.error}
            </Typography>
          </Box>
        )}
      </Card>

      {/* Bottom Split View */}
      <Box sx={{ display: 'flex', flex: 1, gap: 2, minHeight: 0, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left: AST Analyzer */}
        <Card variant="outlined" sx={{ width: { xs: '100%', lg: '33.33%' }, display: 'flex', flexDirection: 'column', bgcolor: 'white', minHeight: 250 }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'grey.50' }}>
            <AnalyticsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>AST Analyzer</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            {parseResult.ast ? renderAstNode(parseResult.ast) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', gap: 1 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  No valid regex to analyze.
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* Right: Test String & Matches */}
        <Card variant="outlined" sx={{ width: { xs: '100%', lg: '66.66%' }, display: 'flex', flexDirection: 'column', bgcolor: 'white', minHeight: 400 }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextFieldsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Test String & Matches</Typography>
            </Box>
            <Chip 
              label={`${matchResult.matches.length} match${matchResult.matches.length !== 1 ? 'es' : ''}`} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }} 
            />
          </Box>
          
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
            {/* Input Textarea */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', minHeight: 120, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Test String</Typography>
              <TextField
                multiline
                fullWidth
                value={sampleText}
                onChange={e => setSampleText(e.target.value)}
                placeholder="Enter test string here..."
                slotProps={{
                  htmlInput: { spellCheck: false },
                  input: { sx: { fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6 } }
                }}
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'flex-start',
                    p: 1,
                  },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                }}
              />
            </Box>
            
            {/* Output Highlight Area */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', minHeight: 100 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>Highlight Preview</Typography>
              <Box sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.875rem', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                lineHeight: 1.6,
                color: 'text.primary'
              }}>
                {renderHighlight()}
              </Box>
            </Box>
            
            {/* Match Details Area */}
            <Box sx={{ p: 2, flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1.5 }}>Match Details</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {matchResult.matches.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>No matches found.</Typography>
                ) : (
                  matchResult.matches.map((m: any, idx: number) => (
                    <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ bgcolor: 'primary.50', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Match {idx + 1}:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'white', px: 1, py: 0.2, borderRadius: 1, border: '1px solid', borderColor: 'primary.light', fontSize: '0.8125rem' }}>{m.text}</Typography>
                      </Box>
                      {(m.groups.length > 0 || m.namedGroups) && (
                        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {m.groups.map((g: any) => (
                            <Box key={g.index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label={`Group ${g.index}`} size="small" variant="filled" sx={{ fontSize: '0.75rem', height: 20 }} />
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{g.value !== undefined ? g.value : <span style={{ color: '#aaa', fontStyle: 'italic' }}>undefined</span>}</Typography>
                            </Box>
                          ))}
                          {m.namedGroups && Object.entries(m.namedGroups).map(([name, value], i) => (
                            <Box key={`named-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label={`Name: ${name}`} size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.75rem', height: 20 }} />
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{value !== undefined ? String(value) : <span style={{ color: '#aaa', fontStyle: 'italic' }}>undefined</span>}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
