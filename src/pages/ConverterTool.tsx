import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, TextField, 
  MenuItem, Select, IconButton, Tooltip,
  Stack, Divider, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CompressIcon from '@mui/icons-material/Compress';

import YAML from 'yaml';
import { xml2js, js2xml } from 'xml-js';
import * as TOML from '@iarna/toml';

type FormatType = 'json' | 'yaml' | 'xml' | 'toml' | 'url';

const FORMATS: { value: FormatType; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'toml', label: 'TOML' },
  { value: 'url', label: 'URL Query String' },
];

export default function ConverterTool() {
  const [inputData, setInputData] = useState<string>('{\n  "hello": "world",\n  "tools": ["regex", "time", "converter"]\n}');
  const [inputFormat, setInputFormat] = useState<FormatType>('json');
  const [outputFormat, setOutputFormat] = useState<FormatType>('yaml');
  const [outputData, setOutputData] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Format options
  const [spaces, setSpaces] = useState<number>(2);

  const parseInput = (data: string, format: FormatType): any => {
    if (!data.trim()) return null;
    
    switch (format) {
      case 'json':
        return JSON.parse(data);
      case 'yaml':
        return YAML.parse(data);
      case 'xml':
        // compact: true creates a simpler JS object
        return xml2js(data, { compact: true, ignoreDeclaration: true });
      case 'toml':
        return TOML.parse(data);
      case 'url': {
        const params = new URLSearchParams(data.includes('?') ? data.split('?')[1] : data);
        const obj: Record<string, string> = {};
        params.forEach((value, key) => {
          obj[key] = value;
        });
        return obj;
      }
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  };

  const stringifyOutput = (obj: any, format: FormatType, spaceCount: number): string => {
    if (obj === null || obj === undefined) return '';
    
    switch (format) {
      case 'json':
        return JSON.stringify(obj, null, spaceCount);
      case 'yaml':
        // yaml stringifies using 2 spaces by default usually, but we can try to pass options if needed.
        return YAML.stringify(obj, { indent: spaceCount });
      case 'xml':
        // xml-js needs a root element sometimes, but we do our best.
        // If obj doesn't have a single root, we might need to wrap it.
        const keys = Object.keys(obj);
        let xmlObj = obj;
        if (keys.length !== 1) {
          xmlObj = { root: obj };
        }
        return js2xml(xmlObj, { compact: true, spaces: spaceCount });
      case 'toml':
        // TOML doesn't support null or mixed arrays very well, might throw.
        return TOML.stringify(obj);
      case 'url': {
        // Flatten object slightly or just best-effort for simple objects
        const params = new URLSearchParams();
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        });
        return params.toString();
      }
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  };

  useEffect(() => {
    try {
      if (!inputData.trim()) {
        setOutputData('');
        setErrorMsg(null);
        return;
      }
      
      const parsed = parseInput(inputData, inputFormat);
      const stringified = stringifyOutput(parsed, outputFormat, spaces);
      
      setOutputData(stringified);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid format');
    }
  }, [inputData, inputFormat, outputFormat, spaces]);

  const handleSwap = () => {
    if (!errorMsg && outputData) {
      setInputData(outputData);
      const tempFormat = inputFormat;
      setInputFormat(outputFormat);
      setOutputFormat(tempFormat);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputData);
  };

  const handleFormat = () => {
    // Just trigger a re-render to apply current spaces logic (which is already reactive)
    // But if they clicked Minify before, setting spaces > 0 fixes it.
    if (spaces === 0) setSpaces(2);
    // If we want to format input pane too, we could try to parse and stringify back to input format.
    try {
      const parsed = parseInput(inputData, inputFormat);
      setInputData(stringifyOutput(parsed, inputFormat, spaces === 0 ? 2 : spaces));
    } catch (e) {
      // ignore formatting if input is invalid
    }
  };

  const handleMinify = () => {
    setSpaces(0);
    // Minify input pane if it's json/xml
    try {
      const parsed = parseInput(inputData, inputFormat);
      setInputData(stringifyOutput(parsed, inputFormat, 0));
    } catch (e) {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLInputElement;
    if (e.key === 'Enter') {
      e.preventDefault();
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const value = target.value;

      const currentLineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.slice(currentLineStart, start);
      
      const match = currentLine.match(/^\s*/);
      const whitespace = match ? match[0] : '';

      const newValue = value.slice(0, start) + '\n' + whitespace + value.slice(end);
      setInputData(newValue);
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1 + whitespace.length;
      }, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const value = target.value;

      const newValue = value.slice(0, start) + '  ' + value.slice(end);
      setInputData(newValue);
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Data Converter
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Format / Beautify">
            <IconButton onClick={handleFormat} size="small" sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
              <FormatAlignLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Minify">
            <IconButton onClick={handleMinify} size="small" sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
              <CompressIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem />
          <ToggleButtonGroup
            value={spaces}
            exclusive
            onChange={(_, val) => val !== null && setSpaces(val)}
            size="small"
            sx={{ bgcolor: 'white' }}
          >
            <ToggleButton value={2} sx={{ py: 0.2 }}>2 spaces</ToggleButton>
            <ToggleButton value={4} sx={{ py: 0.2 }}>4 spaces</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, gap: 2, minHeight: 0, flexDirection: { xs: 'column', md: 'row' } }}>
        
        {/* Input Panel */}
        <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ mr: 2, fontWeight: 600 }}>Input</Typography>
            <Select
              size="small"
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value as FormatType)}
              sx={{ minWidth: 150, bgcolor: 'white' }}
            >
              {FORMATS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ flex: 1, p: 0, position: 'relative' }}>
            <TextField
              multiline
              fullWidth
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Paste your ${FORMATS.find(f => f.value === inputFormat)?.label} here...`}
              sx={{
                height: '100%',
                '& .MuiInputBase-root': {
                  height: '100%',
                  alignItems: 'flex-start',
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                },
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
              }}
            />
          </Box>
        </Card>

        {/* Center Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="Swap Formats & Data">
            <IconButton 
              onClick={handleSwap}
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                boxShadow: 2
              }}
            >
              <SyncAltIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Output Panel */}
        <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ mr: 2, fontWeight: 600 }}>Output</Typography>
              <Select
                size="small"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as FormatType)}
                sx={{ minWidth: 150, bgcolor: 'white' }}
              >
                {FORMATS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </Select>
            </Box>
            <Tooltip title="Copy to clipboard">
              <IconButton size="small" onClick={handleCopy} disabled={!!errorMsg || !outputData}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={{ flex: 1, p: 2, overflow: 'auto', position: 'relative', bgcolor: errorMsg ? 'error.50' : 'transparent' }}>
            {errorMsg ? (
              <Typography color="error" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {errorMsg}
              </Typography>
            ) : (
              <Typography 
                component="pre" 
                sx={{ 
                  m: 0, 
                  fontFamily: 'monospace', 
                  fontSize: '0.875rem', 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all' 
                }}
              >
                {outputData}
              </Typography>
            )}
          </Box>
        </Card>

      </Box>
    </Box>
  );
}
