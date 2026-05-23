import { useState, useRef } from 'react';
import { 
  Box, Typography, Card, TextField, 
  IconButton, Tooltip,
  Button, Paper, Stack, Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';

export default function ImageEncoderTool() {
  // Image Tab State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{name: string, size: number, type: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [base64Input, setBase64Input] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (text: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  const handleBase64Input = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBase64Input(val);
    if (!val.trim()) return;

    let src = val.trim();
    if (!src.startsWith('data:image/')) {
      // Assume raw base64 and default to png
      src = `data:image/png;base64,${src}`;
    }

    setImageSrc(src);
    setImageMeta({
      name: 'pasted_image',
      size: Math.round(src.length * 0.75), // approximate byte size
      type: src.split(';')[0].replace('data:', '') || 'image/png'
    });
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
        setBase64Input(''); // clear the paste box
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

  const handleClear = () => {
    setImageSrc(null);
    setImageMeta(null);
    setBase64Input('');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ImageIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Image & Base64 Tool
          </Typography>
        </Box>
      </Box>

      <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 2, minHeight: 0 }}>
          {!imageSrc ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
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
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Or Paste Base64 String</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={base64Input}
                  onChange={handleBase64Input}
                  placeholder="Paste Data URI or raw Base64 string here..."
                  slotProps={{
                    input: { sx: { fontFamily: 'monospace', fontSize: '0.875rem' } }
                  }}
                />
              </Box>
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
                    onClick={handleClear}
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
