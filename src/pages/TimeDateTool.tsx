import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField, 
  Stack, Divider, Chip, Tooltip, IconButton, MenuItem, Select,
  ToggleButtonGroup, ToggleButton 
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
  { label: 'New York', tz: 'America/New_York' },
];

type FormatToken = {
  token: string;
  desc: string;
};

const FORMAT_TOKENS_JS: FormatToken[] = [
  { token: 'YYYY', desc: '4-digit year (e.g., 2026)' },
  { token: 'YY', desc: '2-digit year (e.g., 26)' },
  { token: 'MM', desc: 'Month, 2-digits (01-12)' },
  { token: 'MMM', desc: 'Month short (e.g., Jan)' },
  { token: 'MMMM', desc: 'Month full (e.g., January)' },
  { token: 'DD', desc: 'Day of month, 2-digits (01-31)' },
  { token: 'ddd', desc: 'Day of week short (e.g., Sun)' },
  { token: 'dddd', desc: 'Day of week full (e.g., Sunday)' },
  { token: 'HH', desc: 'Hour, 24-hour format (00-23)' },
  { token: 'hh', desc: 'Hour, 12-hour format (01-12)' },
  { token: 'mm', desc: 'Minute (00-59)' },
  { token: 'ss', desc: 'Second (00-59)' },
  { token: 'SSS', desc: 'Millisecond (000-999)' },
  { token: 'A', desc: 'AM/PM' },
  { token: 'Z', desc: 'Offset from UTC (e.g., +09:00)' },
];

const FORMAT_TOKENS_PYTHON: FormatToken[] = [
  { token: '%Y', desc: '4-digit year (e.g., 2026)' },
  { token: '%y', desc: '2-digit year (e.g., 26)' },
  { token: '%m', desc: 'Month, 2-digits (01-12)' },
  { token: '%b', desc: 'Month short (e.g., Jan)' },
  { token: '%B', desc: 'Month full (e.g., January)' },
  { token: '%d', desc: 'Day of month, 2-digits (01-31)' },
  { token: '%a', desc: 'Day of week short (e.g., Sun)' },
  { token: '%A', desc: 'Day of week full (e.g., Sunday)' },
  { token: '%H', desc: 'Hour, 24-hour format (00-23)' },
  { token: '%I', desc: 'Hour, 12-hour format (01-12)' },
  { token: '%M', desc: 'Minute (00-59)' },
  { token: '%S', desc: 'Second (00-59)' },
  { token: '%f', desc: 'Microsecond (mapped to Millisecond)' },
  { token: '%p', desc: 'AM/PM' },
  { token: '%z', desc: 'Offset from UTC (e.g., +0900)' },
];

const FORMAT_TOKENS_JAVA: FormatToken[] = [
  { token: 'yyyy', desc: '4-digit year (e.g., 2026)' },
  { token: 'yy', desc: '2-digit year (e.g., 26)' },
  { token: 'MM', desc: 'Month, 2-digits (01-12)' },
  { token: 'MMM', desc: 'Month short (e.g., Jan)' },
  { token: 'MMMM', desc: 'Month full (e.g., January)' },
  { token: 'dd', desc: 'Day of month, 2-digits (01-31)' },
  { token: 'EEE', desc: 'Day of week short (e.g., Sun)' },
  { token: 'EEEE', desc: 'Day of week full (e.g., Sunday)' },
  { token: 'HH', desc: 'Hour, 24-hour format (00-23)' },
  { token: 'hh', desc: 'Hour, 12-hour format (01-12)' },
  { token: 'mm', desc: 'Minute (00-59)' },
  { token: 'ss', desc: 'Second (00-59)' },
  { token: 'SSS', desc: 'Millisecond (000-999)' },
  { token: 'a', desc: 'AM/PM' },
  { token: 'Z', desc: 'Offset from UTC (e.g., +0900)' },
];

const getFormatTokens = (lang: string) => {
  if (lang === 'python') return FORMAT_TOKENS_PYTHON;
  if (lang === 'java') return FORMAT_TOKENS_JAVA;
  return FORMAT_TOKENS_JS;
};

const convertFormatToDayjs = (formatStr: string, lang: string): string => {
  if (lang === 'js') return formatStr;
  
  if (lang === 'python') {
    let converted = formatStr;
    converted = converted.replace(/%Y/g, 'YYYY');
    converted = converted.replace(/%y/g, 'YY');
    converted = converted.replace(/%m/g, 'MM');
    converted = converted.replace(/%B/g, 'MMMM');
    converted = converted.replace(/%b/g, 'MMM');
    converted = converted.replace(/%h/g, 'MMM');
    converted = converted.replace(/%d/g, 'DD');
    converted = converted.replace(/%A/g, 'dddd');
    converted = converted.replace(/%a/g, 'ddd');
    converted = converted.replace(/%H/g, 'HH');
    converted = converted.replace(/%I/g, 'hh');
    converted = converted.replace(/%M/g, 'mm');
    converted = converted.replace(/%S/g, 'ss');
    converted = converted.replace(/%f/g, 'SSS');
    converted = converted.replace(/%p/g, 'A');
    converted = converted.replace(/%z/g, 'Z');
    return converted;
  }
  
  if (lang === 'java') {
    let converted = formatStr;
    converted = converted.replace(/yyyy/g, 'YYYY');
    converted = converted.replace(/yy/g, 'YY');
    // MM, MMM, MMMM are identical in Java and dayjs
    converted = converted.replace(/dd/g, 'DD');
    converted = converted.replace(/EEEE/g, 'dddd');
    converted = converted.replace(/EEE/g, 'ddd');
    // HH, hh, mm, ss, SSS, Z are identical
    converted = converted.replace(/a/g, 'A');
    return converted;
  }
  
  return formatStr;
};

export default function TimeDateTool() {
  const [now, setNow] = useState(dayjs());
  
  // Converter State
  const [timestampStr, setTimestampStr] = useState<string>(now.valueOf().toString());
  const [timestampType, setTimestampType] = useState<'ms' | 's'>('ms');
  const [dateStr, setDateStr] = useState<string>(now.format('YYYY-MM-DDTHH:mm:ss'));
  
  // Format Builder State
  const [formatLanguage, setFormatLanguage] = useState<'js' | 'python' | 'java'>('js');
  const [formatStr, setFormatStr] = useState<string>('YYYY-MM-DD HH:mm:ss');

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
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        Time & Date
      </Typography>

      {/* World Clocks */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {WORLD_CLOCKS.map((clock) => (
            <Card variant="outlined" sx={{ bgcolor: 'white', flex: '1 1 180px' }} key={clock.label}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {clock.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {clock.tz === 'UTC' ? 'UTC' : `UTC ${now.tz(clock.tz).format('Z')}`}
                  </Typography>
                </Box>
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, flex: 1, minHeight: 0 }}>
        {/* Converter Panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Card variant="outlined" sx={{ bgcolor: 'white', flex: 1, overflow: 'auto' }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Card variant="outlined" sx={{ bgcolor: 'white', flex: 1, overflow: 'auto' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Date Format Builder
                </Typography>
                <ToggleButtonGroup
                  value={formatLanguage}
                  exclusive
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setFormatLanguage(newValue);
                      if (newValue === 'python') setFormatStr('%Y-%m-%d %H:%M:%S');
                      else if (newValue === 'java') setFormatStr('yyyy-MM-dd HH:mm:ss');
                      else setFormatStr('YYYY-MM-DD HH:mm:ss');
                    }
                  }}
                  size="small"
                >
                  <ToggleButton value="js" sx={{ px: 2, py: 0.5 }}>JS (dayjs)</ToggleButton>
                  <ToggleButton value="python" sx={{ px: 2, py: 0.5 }}>Python</ToggleButton>
                  <ToggleButton value="java" sx={{ px: 2, py: 0.5 }}>Java/C#</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
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
                    {now.format(convertFormatToDayjs(formatStr, formatLanguage)) || 'Invalid Format'}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopy(now.format(convertFormatToDayjs(formatStr, formatLanguage)))} 
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
                    {getFormatTokens(formatLanguage).map((item) => (
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
