import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Slider,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import ipaddr from 'ipaddr.js';

// --- Utils ---

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
}

function getMaskInt(cidr: number): number {
  if (cidr === 0) return 0;
  return (~((1 << (32 - cidr)) - 1)) >>> 0;
}

function getWildcardInt(cidr: number): number {
  if (cidr === 32) return 0;
  return ((1 << (32 - cidr)) - 1) >>> 0;
}

function intToBinaryString(int: number): string {
  return (int >>> 0).toString(2).padStart(32, '0');
}

// --- Component ---

const CidrTool: React.FC = () => {
  const [ipInput, setIpInput] = useState<string>('192.168.1.50');
  const [cidr, setCidr] = useState<number>(24);
  const [error, setError] = useState<string>('');

  // Handle direct "IP/CIDR" pasting
  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val.includes('/')) {
      const [ip, prefix] = val.split('/');
      setIpInput(ip);
      const parsedPrefix = parseInt(prefix, 10);
      if (!isNaN(parsedPrefix) && parsedPrefix >= 0 && parsedPrefix <= 32) {
        setCidr(parsedPrefix);
      }
    } else {
      setIpInput(val);
    }
  };

  useEffect(() => {
    if (ipInput === '') {
      setError('');
      return;
    }
    if (!ipaddr.IPv4.isValid(ipInput)) {
      setError('Invalid IPv4 Address');
    } else {
      setError('');
    }
  }, [ipInput]);

  // Calculations
  const calculated = useMemo(() => {
    if (!ipaddr.IPv4.isValid(ipInput)) return null;

    const ipInt = ipToInt(ipInput);
    const maskInt = getMaskInt(cidr);
    const wildcardInt = getWildcardInt(cidr);
    
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;

    let firstUsableInt = networkInt + 1;
    let lastUsableInt = broadcastInt - 1;
    let totalHosts = broadcastInt - networkInt - 1;

    // Edge cases for /31 and /32
    if (cidr === 31) {
      firstUsableInt = networkInt;
      lastUsableInt = broadcastInt;
      totalHosts = 2;
    } else if (cidr === 32) {
      firstUsableInt = networkInt;
      lastUsableInt = networkInt;
      totalHosts = 1;
    }

    return {
      ip: ipInput,
      cidr,
      maskStr: intToIp(maskInt),
      wildcardStr: intToIp(wildcardInt),
      networkStr: intToIp(networkInt),
      broadcastStr: intToIp(broadcastInt),
      firstUsableStr: intToIp(firstUsableInt),
      lastUsableStr: intToIp(lastUsableInt),
      totalHosts,
      
      // Binary strings for visualization
      ipBin: intToBinaryString(ipInt),
      maskBin: intToBinaryString(maskInt),
    };
  }, [ipInput, cidr]);

  // Possible subnets table
  const subnetsTable = useMemo(() => {
    if (!ipaddr.IPv4.isValid(ipInput)) return [];
    const ipInt = ipToInt(ipInput);
    const results = [];
    // Just showing common typical subnets /8 to /32
    for (let i = 8; i <= 32; i++) {
      const maskI = getMaskInt(i);
      const netI = (ipInt & maskI) >>> 0;
      const wildI = getWildcardInt(i);
      const broadI = (netI | wildI) >>> 0;
      let hosts = broadI - netI - 1;
      if (i === 31) hosts = 2;
      if (i === 32) hosts = 1;

      results.push({
        cidr: i,
        mask: intToIp(maskI),
        network: intToIp(netI),
        hosts,
      });
    }
    return results;
  }, [ipInput]);


  // Binary Renderer Helper
  const renderBinary = (binString: string, splitCidr: number) => {
    // Function to add dots to a binary part while maintaining the 8-bit octet boundary
    // Because we slice arbitrary lengths, we just inject dots at indices 8, 16, 24 of the ORIGINAL string.
    
    const chars = [];
    for (let i = 0; i < 32; i++) {
      if (i > 0 && i % 8 === 0) {
        chars.push(<span key={`dot-${i}`} style={{ color: '#888', margin: '0 2px' }}>.</span>);
      }
      const isNet = i < splitCidr;
      chars.push(
        <span 
          key={i} 
          style={{ 
            color: isNet ? '#3b82f6' : '#ef4444', 
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontSize: '1.1rem'
          }}
        >
          {binString[i]}
        </span>
      );
    }

    return <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>{chars}</Box>;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          IPv4 Subnet & CIDR Calculator
        </Typography>
        <Chip label="dev_18" size="small" color="secondary" variant="outlined" />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Inputs */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Configuration</Typography>
            
            <TextField
              label="IPv4 Address"
              fullWidth
              variant="outlined"
              value={ipInput}
              onChange={handleIpChange}
              error={!!error}
              helperText={error || "e.g., 192.168.1.50 or 10.0.0.1/24"}
              sx={{ mb: 4 }}
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: '1.1rem' } } }}
            />

            <Typography gutterBottom sx={{ fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
              <span>CIDR Prefix</span>
              <Chip size="small" color="primary" label={`/${cidr}`} />
            </Typography>
            
            <Slider
              value={cidr}
              onChange={(_e, val) => setCidr(val as number)}
              min={0}
              max={32}
              step={1}
              marks={[
                { value: 0, label: '/0' },
                { value: 8, label: '/8' },
                { value: 16, label: '/16' },
                { value: 24, label: '/24' },
                { value: 32, label: '/32' },
              ]}
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            
            {calculated && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">Subnet Mask</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {calculated.maskStr}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Results */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Network Details</Typography>
            
            {!calculated ? (
              <Alert severity="info">Enter a valid IPv4 address to see subnet details.</Alert>
            ) : (
              <>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Network Address</Typography>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>{calculated.networkStr}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Broadcast Address</Typography>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', color: 'error.main' }}>{calculated.broadcastStr}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Usable Host Range</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                        {calculated.firstUsableStr} - {calculated.lastUsableStr}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Total Usable Hosts</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {calculated.totalHosts.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Wildcard Mask</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {calculated.wildcardStr}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Binary View */}
                <Box sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                    Binary Representation
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip size="small" label="Network" sx={{ bgcolor: '#3b82f622', color: '#3b82f6', fontWeight: 'bold' }} />
                      <Chip size="small" label="Host" sx={{ bgcolor: '#ef444422', color: '#ef4444', fontWeight: 'bold' }} />
                    </Box>
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>IP Address</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 10 }}>
                      {renderBinary(calculated.ipBin, calculated.cidr)}
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Subnet Mask</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 10 }}>
                      {renderBinary(calculated.maskBin, calculated.cidr)}
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* Bottom Full Width: Reference Table */}
        <Grid size={{ xs: 12 }}>
           <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
             <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Possible Subnets</Typography>
             <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
               This table shows all possible subnet configurations (from /8 to /32) containing the IP address <strong>{ipInput}</strong>.
             </Typography>
             
             <TableContainer sx={{ maxHeight: 400 }}>
               <Table stickyHeader size="small">
                 <TableHead>
                   <TableRow>
                     <TableCell sx={{ fontWeight: 'bold' }}>CIDR</TableCell>
                     <TableCell sx={{ fontWeight: 'bold' }}>Subnet Mask</TableCell>
                     <TableCell sx={{ fontWeight: 'bold' }}>Network Address</TableCell>
                     <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Hosts</TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {subnetsTable.map((row) => (
                     <TableRow 
                      key={row.cidr}
                      sx={{ 
                        bgcolor: row.cidr === cidr ? 'action.selected' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                       <TableCell sx={{ fontFamily: 'monospace' }}>
                         <Chip 
                           label={`/${row.cidr}`} 
                           size="small" 
                           color={row.cidr === cidr ? "primary" : "default"} 
                           variant={row.cidr === cidr ? "filled" : "outlined"}
                         />
                       </TableCell>
                       <TableCell sx={{ fontFamily: 'monospace' }}>{row.mask}</TableCell>
                       <TableCell sx={{ fontFamily: 'monospace' }}>{row.network}</TableCell>
                       <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{row.hosts.toLocaleString()}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>
           </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default CidrTool;
