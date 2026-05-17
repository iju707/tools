import { useState, useRef } from 'react';
import { 
  Box, Typography, Card, TextField, 
  IconButton, Tooltip, Tabs, Tab, 
  Button, Paper, Stack, Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

import CryptoJS from 'crypto-js';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`encoder-tabpanel-${index}`}
      aria-labelledby={`encoder-tab-${index}`}
      sx={{ flex: 1, display: value === index ? 'flex' : 'none', flexDirection: 'column', minHeight: 0 }}
      {...other}
    >
      {children}
    </Box>
  );
}

export default function EncoderTool() {
  const [tabValue, setTabValue] = useState(0);

  // Text Tab State
  const [inputText, setInputText] = useState('');
  
  // Image Tab State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{name: string, size: number, type: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Values for Text
  const base64Encoded = (() => {
    try { return btoa(encodeURIComponent(inputText).replace(/%([0-9A-F]{2})/g, (_match, p1) => String.fromCharCode(parseInt(p1, 16)))); }
    catch { return 'Error encoding Base64'; }
  })();
  
  const base64Decoded = (() => {
    if (!inputText) return '';
    try { return decodeURIComponent(atob(inputText).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
    catch { return 'Invalid Base64 string'; }
  })();

  const urlEncoded = encodeURIComponent(inputText);
  const urlDecoded = (() => {
    try { return decodeURIComponent(inputText); }
    catch { return 'Invalid URL encoded string'; }
  })();

  const hashMd5 = inputText ? CryptoJS.MD5(inputText).toString() : '';
  const hashSha1 = inputText ? CryptoJS.SHA1(inputText).toString() : '';
  const hashSha256 = inputText ? CryptoJS.SHA256(inputText).toString() : '';
  const hashSha512 = inputText ? CryptoJS.SHA512(inputText).toString() : '';

  const handleCopy = (text: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  // Image Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setImageSrc(e.target.result);
        setImageMeta({
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Base64 & Hash Tool
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} aria-label="encoder tabs">
            <Tab label="Text Encoder & Hash" />
            <Tab label="Image to Base64" />
          </Tabs>
        </Box>

        {/* TEXT TAB */}
        <CustomTabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' }, p: 2, gap: 2, minHeight: 0 }}>
            {/* Input */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Input String</Typography>
              <TextField
                multiline
                fullWidth
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste text here..."
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'flex-start',
                    fontFamily: 'monospace',
                  }
                }}
              />
            </Box>

            {/* Output */}
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, pr: 1 }}>
              
              {/* Encoders */}
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>Encode / Decode</Typography>
                <Stack spacing={2}>
                  <Box>
                    <ResultBox title="Base64 Encode" value={base64Encoded} onCopy={() => handleCopy(base64Encoded)} />
                  </Box>
                  <Box>
                    <ResultBox title="Base64 Decode" value={base64Decoded} onCopy={() => handleCopy(base64Decoded)} />
                  </Box>
                  <Box>
                    <ResultBox title="URL Encode" value={urlEncoded} onCopy={() => handleCopy(urlEncoded)} />
                  </Box>
                  <Box>
                    <ResultBox title="URL Decode" value={urlDecoded} onCopy={() => handleCopy(urlDecoded)} />
                  </Box>
                </Stack>
              </Card>

              {/* Hashes */}
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'secondary.main' }}>Hashes</Typography>
                <Stack spacing={2}>
                  <Box>
                    <ResultBox title="MD5" value={hashMd5} onCopy={() => handleCopy(hashMd5)} />
                  </Box>
                  <Box>
                    <ResultBox title="SHA-1" value={hashSha1} onCopy={() => handleCopy(hashSha1)} />
                  </Box>
                  <Box>
                    <ResultBox title="SHA-256" value={hashSha256} onCopy={() => handleCopy(hashSha256)} />
                  </Box>
                  <Box>
                    <ResultBox title="SHA-512" value={hashSha512} onCopy={() => handleCopy(hashSha512)} />
                  </Box>
                </Stack>
              </Card>

            </Box>
          </Box>
        </CustomTabPanel>

        {/* IMAGE TAB */}
        <CustomTabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 2, minHeight: 0 }}>
            {!imageSrc ? (
              <Box 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: isDragging ? 'primary.main' : 'grey.300',
                  bgcolor: isDragging ? 'primary.50' : 'grey.50',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Drag & Drop an image here</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse files</Typography>
                <Button variant="contained" disableElevation>Select Image</Button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' }, gap: 3, minHeight: 0 }}>
                {/* Image Preview */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Image Preview</Typography>
                    <Button 
                      startIcon={<DeleteIcon />} 
                      color="error" 
                      size="small"
                      onClick={() => { setImageSrc(null); setImageMeta(null); }}
                    >
                      Clear
                    </Button>
                  </Box>
                  <Paper variant="outlined" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'grey.50', overflow: 'hidden' }}>
                    <img src={imageSrc} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </Paper>
                  {imageMeta && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip size="small" label={imageMeta.name} />
                      <Chip size="small" label={`${(imageMeta.size / 1024).toFixed(1)} KB`} />
                      <Chip size="small" label={imageMeta.type} />
                    </Stack>
                  )}
                </Box>

                {/* Base64 Results */}
                <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, pr: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Generated Base64 Tags</Typography>
                  
                  <ResultBox 
                    title="Data URI (For CSS background / img src)" 
                    value={imageSrc} 
                    onCopy={() => handleCopy(imageSrc)} 
                    multiline
                  />
                  <ResultBox 
                    title="HTML <img> Tag" 
                    value={`<img src="${imageSrc}" alt="${imageMeta?.name || 'base64 image'}" />`} 
                    onCopy={() => handleCopy(`<img src="${imageSrc}" alt="${imageMeta?.name || 'base64 image'}" />`)} 
                    multiline
                  />
                  <ResultBox 
                    title="Raw Base64" 
                    value={imageSrc.split(',')[1]} 
                    onCopy={() => handleCopy(imageSrc.split(',')[1])} 
                    multiline
                  />
                </Box>
              </Box>
            )}
          </Box>
        </CustomTabPanel>
      </Card>
    </Box>
  );
}

// Helper component for displaying output fields
function ResultBox({ title, value, onCopy, multiline = false }: { title: string, value: string, onCopy: () => void, multiline?: boolean }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{title}</Typography>
        <Tooltip title="Copy">
          <IconButton size="small" onClick={onCopy} sx={{ p: 0.5 }}>
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <TextField
        fullWidth
        size="small"
        value={value}
        multiline={multiline}
        rows={multiline ? 4 : 1}
        slotProps={{
          htmlInput: { readOnly: true },
          input: { sx: { fontFamily: 'monospace', fontSize: '0.8125rem', bgcolor: 'grey.50' } }
        }}
      />
    </Box>
  );
}
