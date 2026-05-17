import { useState } from 'react';
import { 
  Box, Typography, Card, TextField, 
  IconButton, Tooltip, Stack
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import CryptoJS from 'crypto-js';

export default function EncoderTool() {
  const [inputText, setInputText] = useState('');
  
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Base64 & Hash Tool
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
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
