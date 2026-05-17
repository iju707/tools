import { Link } from 'react-router-dom'
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Avatar } from '@mui/material'
import CodeIcon from '@mui/icons-material/Code'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SyncAltIcon from '@mui/icons-material/SyncAlt'
import SecurityIcon from '@mui/icons-material/Security'
import ImageIcon from '@mui/icons-material/Image'

interface ToolCard {
  name: string
  description: string
  path: string
  icon: React.ReactNode
  color: string
  gradient: string
}

export default function Home() {
  const tools: ToolCard[] = [
    {
      name: 'Regex Tool',
      description: 'Test, validate, and debug regular expressions in real-time with syntax highlighting and match statistics.',
      path: '/regex',
      icon: <CodeIcon sx={{ fontSize: 32 }} />,
      color: '#3f51b5',
      gradient: 'linear-gradient(135deg, #3f51b5 0%, #2196f3 100%)',
    },
    {
      name: 'Time & Date Tool',
      description: 'Convert Unix timestamps to readable datetimes, format date values, and generate Python/JS style format strings.',
      path: '/time',
      icon: <AccessTimeIcon sx={{ fontSize: 32 }} />,
      color: '#e91e63',
      gradient: 'linear-gradient(135deg, #ec407a 0%, #d81b60 100%)',
    },
    {
      name: 'Format Converter',
      description: 'Bidirectionally convert and format files between JSON, YAML, TOML, XML, and URL Query strings with error diagnostics.',
      path: '/converter',
      icon: <SyncAltIcon sx={{ fontSize: 32 }} />,
      color: '#009688',
      gradient: 'linear-gradient(135deg, #00b0ff 0%, #009688 100%)',
    },
    {
      name: 'Base64 & Hash',
      description: 'Encode/decode text payloads using Base64 or URL Encode, and hash strings in real-time via MD5, SHA-1, SHA-256, and SHA-512.',
      path: '/encoder',
      icon: <SecurityIcon sx={{ fontSize: 32 }} />,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #ab47bc 0%, #7b1fa2 100%)',
    },
    {
      name: 'Image & Base64',
      description: 'Seamlessly convert images to Base64 strings, or paste base64 strings to decode and preview images instantly.',
      path: '/image-base64',
      icon: <ImageIcon sx={{ fontSize: 32 }} />,
      color: '#ff9800',
      gradient: 'linear-gradient(135deg, #ffb74d 0%, #f57c00 100%)',
    },
  ]

  return (
    <Box sx={{ p: { xs: 3, md: 5 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 6, mt: 2 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            letterSpacing: '-1px'
          }}
        >
          OOFBIRD Dev Tools
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 600, mx: 'auto' }}>
          A suite of premium web utilities crafted specifically for developers. Fast, client-side, and secure.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        {tools.map((tool) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tool.name}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.08)',
                  borderColor: 'primary.light',
                }
              }}
            >
              <CardActionArea 
                component={Link} 
                to={tool.path}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  p: 3
                }}
              >
                <Avatar 
                  sx={{ 
                    background: tool.gradient, 
                    color: 'white',
                    width: 56, 
                    height: 56, 
                    mb: 2.5,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                  }}
                >
                  {tool.icon}
                </Avatar>
                
                <CardContent sx={{ p: 0, width: '100%' }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {tool.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
