import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import RegexTool from './pages/RegexTool'
import TimeDateTool from './pages/TimeDateTool'
import ConverterTool from './pages/ConverterTool'
import EncoderTool from './pages/EncoderTool'
import ImageEncoderTool from './pages/ImageEncoderTool'
import CronTool from './pages/CronTool'
import Home from './pages/Home'
import DiffTool from './pages/DiffTool'
import CidrTool from './pages/CidrTool'

import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import GitHubIcon from '@mui/icons-material/GitHub'
import CodeIcon from '@mui/icons-material/Code'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SyncAltIcon from '@mui/icons-material/SyncAlt'
import SecurityIcon from '@mui/icons-material/Security'
import ImageIcon from '@mui/icons-material/Image'
import AlarmIcon from '@mui/icons-material/Alarm'
import DifferenceIcon from '@mui/icons-material/Difference'
import LanIcon from '@mui/icons-material/Lan'

const DRAWER_WIDTH = 256;
const COLLAPSED_WIDTH = 64;

function App() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const navItems = [
    { name: 'Regex', path: '/regex', icon: <CodeIcon /> },
    { name: 'Time & Date', path: '/time', icon: <AccessTimeIcon /> },
    { name: 'Converter', path: '/converter', icon: <SyncAltIcon /> },
    { name: 'Base64 & Hash', path: '/encoder', icon: <SecurityIcon /> },
    { name: 'Image & Base64', path: '/image-base64', icon: <ImageIcon /> },
    { name: 'Cron Generator', path: '/cron', icon: <AlarmIcon /> },
    { name: 'Diff Tool', path: '/diff', icon: <DifferenceIcon /> },
    { name: 'IP / CIDR', path: '/cidr', icon: <LanIcon /> },
  ]

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'grey.50' }}>
      <CssBaseline />
      
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component={Link} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold', 
              color: 'text.primary', 
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
              OOFBIRD Dev Tools
          </Typography>

          <IconButton
            color="inherit"
            component="a"
            href="https://github.com/iju707/tools"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={isSidebarOpen}
        sx={{
          width: isSidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH,
          flexShrink: 0,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: isSidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH,
            boxSizing: 'border-box',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            borderRight: '1px solid',
            borderColor: 'grey.200',
          },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ overflow: 'hidden', mt: 1 }}>
          <List>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.name} disablePadding sx={{ display: 'block', px: 1, mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                      minHeight: 48,
                      justifyContent: isSidebarOpen ? 'initial' : 'center',
                      px: 2.5,
                      borderRadius: 1,
                      bgcolor: isActive ? 'primary.50' : 'transparent',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        bgcolor: isActive ? 'primary.100' : 'grey.100',
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: isSidebarOpen ? 2 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.name} 
                      sx={{ 
                        opacity: isSidebarOpen ? 1 : 0, 
                        display: isSidebarOpen ? 'block' : 'none',
                        '& .MuiTypography-root': {
                          fontWeight: isActive ? 600 : 500,
                        }
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar /> {/* Spacer for AppBar */}
        
        {/* Dynamic Page Content */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'grey.50' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/regex" element={<RegexTool />} />
            <Route path="/time" element={<TimeDateTool />} />
            <Route path="/converter" element={<ConverterTool />} />
            <Route path="/encoder" element={<EncoderTool />} />
            <Route path="/image-base64" element={<ImageEncoderTool />} />
            <Route path="/cron" element={<CronTool />} />
            <Route path="/diff" element={<DiffTool />} />
            <Route path="/cidr" element={<CidrTool />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  )
}

export default App
