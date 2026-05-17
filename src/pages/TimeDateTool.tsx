import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField, 
  Stack, Divider, Chip, Tooltip, IconButton, MenuItem, Select 
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const WORLD_CLOCKS = [
  { label: 'Local', tz: dayjs.tz.guess() },
  { label: 'UTC', tz: 'UTC' },
  { label: 'KST (Seoul)', tz: 'Asia/Seoul' },
  { label: 'PST (Pacific)', tz: 'America/Los_Angeles' },
  { label: 'EST (Eastern)', tz: 'America/New_York' },
];

const FORMAT_TOKENS = [
  { token: 'YYYY', desc: '4-digit year (e.g., 2026)' },
  { token: 'YY', desc: '2-digit year (e.g., 26)' },
  { token: 'MM', desc: 'Month, 2-digits (01-12)' },
  { token: 'DD', desc: 'Day of month, 2-digits (01-31)' },
  { token: 'HH', desc: 'Hour, 24-hour format (00-23)' },
  { token: 'hh', desc: 'Hour, 12-hour format (01-12)' },
  { token: 'mm', desc: 'Minute (00-59)' },
  { token: 'ss', desc: 'Second (00-59)' },
  { token: 'SSS', desc: 'Millisecond (000-999)' },
  { token: 'A', desc: 'AM/PM' },
  { token: 'Z', desc: 'Offset from UTC (e.g., +09:00)' },
];

export default function TimeDateTool() {
  const [now, setNow] = useState(dayjs());
  
  // Converter State
  const [timestampStr, setTimestampStr] = useState<string>(now.valueOf().toString());
  const [timestampType, setTimestampType] = useState<'ms' | 's'>('ms');
  const [dateStr, setDateStr] = useState<string>(now.format('YYYY-MM-DDTHH:mm:ss'));
  
  // Format Builder State
  const [formatStr, setFormatStr] = useState<string>('YYYY-MM-DD HH:mm:ss.SSS Z');

  // Ticking Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Timestamp Change
  const handleTimestampChange = (val: string, type: 'ms' | 's') => {
    setTimestampStr(val);
    setTimestampType(type);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      const d = type === 'ms' ? dayjs(num) : dayjs.unix(num);
      if (d.isValid()) {
        setDateStr(d.format('YYYY-MM-DDTHH:mm:ss'));
      }
    }
  };

  // Handle Date Change
  const handleDateChange = (val: string) => {
    setDateStr(val);
    const d = dayjs(val);
    if (d.isValid()) {
      setTimestampStr((timestampType === 'ms' ? d.valueOf() : d.unix()).toString());
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Time & Date
      </Typography>

      {/* World Clocks */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
          Real-time World Clocks
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {WORLD_CLOCKS.map((clock) => (
            <Card variant="outlined" sx={{ bgcolor: 'white', flex: '1 1 180px' }} key={clock.label}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {clock.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'mono', lineHeight: 1 }}>
                  {now.tz(clock.tz).format('HH:mm:ss')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {now.tz(clock.tz).format('YYYY-MM-DD')}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {/* Converter Panel */}
        <Box>
          <Card variant="outlined" sx={{ bgcolor: 'white', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                Two-way Converter
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Unix Timestamp
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField 
                      fullWidth 
                      size="small" 
                      value={timestampStr}
                      onChange={(e) => handleTimestampChange(e.target.value, timestampType)}
                      placeholder="Enter timestamp..."
                    />
                    <Select
                      size="small"
                      value={timestampType}
                      onChange={(e) => handleTimestampChange(timestampStr, e.target.value as 'ms' | 's')}
                      sx={{ minWidth: 100 }}
                    >
                      <MenuItem value="ms">Millis</MenuItem>
                      <MenuItem value="s">Seconds</MenuItem>
                    </Select>
                  </Stack>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Chip label="↕ Auto Converts" size="small" variant="outlined" />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Local Date & Time
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small"
                    type="datetime-local"
                    value={dateStr}
                    onChange={(e) => handleDateChange(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
                
                {dayjs(dateStr).isValid() && (
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">UTC ISO 8601:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {dayjs(dateStr).utc().format()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Relative:</Typography>
                        <Typography variant="body2">
                          {/* We could use relativeTime plugin here, but keeping it simple for now */}
                          {dayjs(dateStr).toString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Format Builder Panel */}
        <Box>
          <Card variant="outlined" sx={{ bgcolor: 'white', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Date Format Builder
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Format String
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={formatStr}
                    onChange={(e) => setFormatStr(e.target.value)}
                    placeholder="e.g. YYYY-MM-DD HH:mm:ss"
                  />
                </Box>

                <Box sx={{ p: 3, bgcolor: 'primary.50', borderRadius: 1, border: '1px dashed', borderColor: 'primary.main', textAlign: 'center' }}>
                  <Typography variant="caption" color="primary.main" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Live Preview (Current Time)
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', color: 'primary.dark' }}>
                    {now.format(formatStr) || 'Invalid Format'}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopy(now.format(formatStr))} 
                    sx={{ mt: 1 }}
                    title="Copy to clipboard"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500, color: 'text.secondary' }}>
                    Available Tokens (Hover for description)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {FORMAT_TOKENS.map((item) => (
                      <Tooltip key={item.token} title={item.desc} arrow placement="top">
                        <Chip 
                          label={item.token} 
                          onClick={() => setFormatStr(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + item.token)}
                          sx={{ 
                            fontFamily: 'monospace', 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'primary.100' }
                          }} 
                        />
                      </Tooltip>
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    * Click a token to append it to the format string.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
