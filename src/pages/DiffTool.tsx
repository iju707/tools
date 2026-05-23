import { useState, useEffect, useRef } from 'react'
import type { UIEvent } from 'react'
import { 
  Box, Typography, Grid, Card, Button, Switch, 
  FormControlLabel, ToggleButton, ToggleButtonGroup, IconButton, 
  Tooltip, Alert, Chip, Divider, InputBase
} from '@mui/material'
import DifferenceIcon from '@mui/icons-material/Difference'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import ViewWeekIcon from '@mui/icons-material/ViewWeek'
import ViewStreamIcon from '@mui/icons-material/ViewStream'

import { diffLines, diffWords } from 'diff'

interface DiffWord {
  added?: boolean
  removed?: boolean
  value: string
}

interface DiffLineSide {
  lineNum?: number
  text: string
  type: 'common' | 'added' | 'removed' | 'empty'
  words?: DiffWord[]
}

interface AlignedDiffLine {
  left: DiffLineSide
  right: DiffLineSide
}

export default function DiffTool() {
  // Input states
  const [leftInput, setLeftInput] = useState<string>('')
  const [rightInput, setRightInput] = useState<string>('')
  
  // Controls
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')
  const [sortJsonKeys, setSortJsonKeys] = useState<boolean>(false)
  const [autoFormatJson, setAutoFormatJson] = useState<boolean>(true)
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(false)
  
  // Output states
  const [alignedLines, setAlignedLines] = useState<AlignedDiffLine[]>([])
  const [stats, setStats] = useState({ additions: 0, deletions: 0, changes: 0 })
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Scroll sync refs
  const leftViewerRef = useRef<HTMLDivElement>(null)
  const rightViewerRef = useRef<HTMLDivElement>(null)
  const leftLineNosRef = useRef<HTMLDivElement>(null)
  const rightLineNosRef = useRef<HTMLDivElement>(null)
  const activeScrollRef = useRef<'left' | 'right' | null>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Demo examples
  const loadExample = (type: 'json' | 'text') => {
    setJsonError(null)
    if (type === 'json') {
      const originalJson = {
        name: "Oofbird Developer Suite",
        version: "1.2.0",
        active: true,
        features: ["regex", "timestamp", "formatter", "encoder"],
        settings: {
          theme: "dark",
          notifications: true,
          editor: {
            fontSize: 14,
            tabSize: 2
          }
        }
      }
      
      const modifiedJson = {
        name: "Oofbird Developer Suite",
        version: "2.0.0-rc1",
        active: false,
        features: ["regex", "timestamp", "formatter", "encoder", "cron-generator", "json-diff"],
        settings: {
          theme: "glassmorphism",
          editor: {
            fontSize: 16,
            tabSize: 2,
            fontFamily: "Fira Code"
          },
          notifications: false
        }
      }
      
      setLeftInput(JSON.stringify(originalJson, null, 2))
      setRightInput(JSON.stringify(modifiedJson, null, 2))
    } else {
      const originalText = `OOFBIRD Dev Tools is a suite of premium web utilities.
It is built with React, Vite, and MUI.
All computations run entirely in the browser.
No data is ever sent to any server.
Enjoy faster development cycles and robust tools.`

      const modifiedText = `OOFBIRD Dev Tools is a gorgeous suite of developer utilities.
It is built with React, Vite, Tailwind, and Material UI.
All computations run securely in the browser.
Absolutely no data is ever sent to external servers.
Enjoy faster development and robust tools every day!`
      
      setLeftInput(originalText)
      setRightInput(modifiedText)
    }
  }

  // Clear all
  const handleClear = () => {
    setLeftInput('')
    setRightInput('')
    setAlignedLines([])
    setStats({ additions: 0, deletions: 0, changes: 0 })
    setJsonError(null)
  }

  // Swap panels
  const handleSwap = () => {
    const temp = leftInput
    setLeftInput(rightInput)
    setRightInput(temp)
  }

  // Auto-format JSON helper
  const tryFormatJSON = (input: string): string => {
    if (!input.trim()) return input
    try {
      const parsed = JSON.parse(input)
      if (sortJsonKeys) {
        return JSON.stringify(sortDeep(parsed), null, 2)
      }
      return JSON.stringify(parsed, null, 2)
    } catch {
      // Return as-is if not valid JSON
      return input
    }
  }

  // Deep sort helper for JSON keys
  const sortDeep = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortDeep)
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((result: any, key: string) => {
          result[key] = sortDeep(obj[key])
          return result
        }, {})
    }
    return obj
  }

  // Beautify active JSON inputs
  const handleBeautify = () => {
    setJsonError(null)
    try {
      if (leftInput.trim()) JSON.parse(leftInput)
      if (rightInput.trim()) JSON.parse(rightInput)
      
      setLeftInput(tryFormatJSON(leftInput))
      setRightInput(tryFormatJSON(rightInput))
    } catch (e: any) {
      setJsonError("일부 입력값이 올바른 JSON 형식이 아닙니다: " + e.message)
    }
  }

  // Synchronized scroll handlers
  const handleViewerScroll = (e: UIEvent<HTMLDivElement>, source: 'left' | 'right') => {
    const currentTarget = e.currentTarget
    
    if (activeScrollRef.current && activeScrollRef.current !== source) {
      return
    }

    activeScrollRef.current = source

    const targetViewer = source === 'left' ? rightViewerRef.current : leftViewerRef.current
    const currentLineNos = source === 'left' ? leftLineNosRef.current : rightLineNosRef.current
    const targetLineNos = source === 'left' ? rightLineNosRef.current : leftLineNosRef.current

    if (targetViewer) {
      targetViewer.scrollTop = currentTarget.scrollTop
      targetViewer.scrollLeft = currentTarget.scrollLeft
    }
    if (currentLineNos) {
      currentLineNos.scrollTop = currentTarget.scrollTop
    }
    if (targetLineNos) {
      targetLineNos.scrollTop = currentTarget.scrollTop
    }

    // Clear previous timeout and reset active ref after scroll finishes
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      activeScrollRef.current = null
    }, 100)
  }

  // Calculate and align diffs
  useEffect(() => {
    let originalText = leftInput
    let modifiedText = rightInput

    // If autoFormat or sortJsonKeys is enabled and it is valid JSON, format it first
    if (autoFormatJson || sortJsonKeys) {
      try {
        if (originalText.trim()) {
          const parsed = JSON.parse(originalText)
          originalText = JSON.stringify(sortJsonKeys ? sortDeep(parsed) : parsed, null, 2)
        }
      } catch { /* ignore and use raw string */ }

      try {
        if (modifiedText.trim()) {
          const parsed = JSON.parse(modifiedText)
          modifiedText = JSON.stringify(sortJsonKeys ? sortDeep(parsed) : parsed, null, 2)
        }
      } catch { /* ignore and use raw string */ }
    }

    // Perform line-by-line diff
    const rawDiffs = diffLines(originalText, modifiedText, { ignoreWhitespace })
    
    // Group differences into structural alignment
    const leftLines: DiffLineSide[] = []
    const rightLines: DiffLineSide[] = []
    
    let leftLineCounter = 1
    let rightLineCounter = 1

    // Prepare temp arrays of lines per diff block
    rawDiffs.forEach((chunk) => {
      const lines = chunk.value.replace(/\n$/, '').split('\n')
      if (chunk.value === '\n') {
        // Edge case: single trailing newline
        if (chunk.added) {
          rightLines.push({ lineNum: rightLineCounter++, text: '', type: 'added' })
        } else if (chunk.removed) {
          leftLines.push({ lineNum: leftLineCounter++, text: '', type: 'removed' })
        } else {
          leftLines.push({ lineNum: leftLineCounter++, text: '', type: 'common' })
          rightLines.push({ lineNum: rightLineCounter++, text: '', type: 'common' })
        }
        return
      }

      lines.forEach((lineText) => {
        if (chunk.added) {
          rightLines.push({ lineNum: rightLineCounter++, text: lineText, type: 'added' })
        } else if (chunk.removed) {
          leftLines.push({ lineNum: leftLineCounter++, text: lineText, type: 'removed' })
        } else {
          leftLines.push({ lineNum: leftLineCounter++, text: lineText, type: 'common' })
          rightLines.push({ lineNum: rightLineCounter++, text: lineText, type: 'common' })
        }
      })
    })

    // Match up left & right lines to align them beautifully
    const aligned: AlignedDiffLine[] = []
    let lIdx = 0
    let rIdx = 0
    
    let adds = 0
    let dels = 0
    let chg = 0

    while (lIdx < leftLines.length || rIdx < rightLines.length) {
      const leftLine = leftLines[lIdx]
      const rightLine = rightLines[rIdx]

      // Case 1: Both exist and are common
      if (leftLine && rightLine && leftLine.type === 'common' && rightLine.type === 'common') {
        aligned.push({ left: leftLine, right: rightLine })
        lIdx++
        rIdx++
      } 
      // Case 2: Left has a deletion block, right has an addition block.
      // We pair them side-by-side to highlight line-level changes and do word-level diffs!
      else if (leftLine && leftLine.type === 'removed' && rightLine && rightLine.type === 'added') {
        // Calculate intra-line word-level difference
        const words = diffWords(leftLine.text, rightLine.text)
        
        aligned.push({
          left: { 
            ...leftLine, 
            type: 'removed',
            words: words.filter(w => !w.added) // Only show original words + deleted words
          },
          right: { 
            ...rightLine, 
            type: 'added',
            words: words.filter(w => !w.removed) // Only show original words + added words
          }
        })
        chg++
        lIdx++
        rIdx++
      }
      // Case 3: Left has a deletion block, but right is common or empty
      else if (leftLine && leftLine.type === 'removed') {
        aligned.push({
          left: leftLine,
          right: { text: '', type: 'empty' }
        })
        dels++
        lIdx++
      }
      // Case 4: Right has an addition block, but left is common or empty
      else if (rightLine && rightLine.type === 'added') {
        aligned.push({
          left: { text: '', type: 'empty' },
          right: rightLine
        })
        adds++
        rIdx++
      }
      // Fail-safe to avoid infinite loop if unexpected data occurs
      else {
        if (leftLine) {
          aligned.push({ left: leftLine, right: { text: '', type: 'empty' } })
          lIdx++
        } else if (rightLine) {
          aligned.push({ left: { text: '', type: 'empty' }, right: rightLine })
          rIdx++
        }
      }
    }

    setAlignedLines(aligned)
    setStats({ additions: adds, deletions: dels, changes: chg })

  }, [leftInput, rightInput, sortJsonKeys, autoFormatJson, ignoreWhitespace])

  // Copy to clipboard helper
  const handleCopy = (side: 'left' | 'right') => {
    const textToCopy = side === 'left' ? leftInput : rightInput
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(side === 'left' ? '원본이 복사되었습니다!' : '비교 대상이 복사되었습니다!')
      setTimeout(() => setCopySuccess(null), 3000)
    })
  }

  // Format line text helper (renders word-level highlighting if available)
  const renderLineText = (line: DiffLineSide) => {
    if (line.type === 'empty') {
      return <span style={{ opacity: 0.15 }}>&nbsp;</span>
    }
    
    if (line.words && line.words.length > 0) {
      return (
        <>
          {line.words.map((part, index) => {
            const isAdded = part.added
            const isRemoved = part.removed
            
            const style = isAdded 
              ? { backgroundColor: '#a5d6a7', color: '#1b5e20', fontWeight: 600, borderRadius: '2px', padding: '0 2px' }
              : isRemoved 
              ? { backgroundColor: '#ef9a9a', color: '#b71c1c', fontWeight: 600, borderRadius: '2px', padding: '0 2px', textDecoration: 'line-through' }
              : {}
              
            return (
              <span key={index} style={style}>
                {part.value}
              </span>
            )
          })}
        </>
      )
    }

    return line.text || <>&nbsp;</>
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3, height: 'calc(100vh - 64px)' }}>
      
      {/* Header Section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DifferenceIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            JSON Diff & 텍스트 비교 도구
          </Typography>
        </Box>
        
        {/* Statistics and Quick Options */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {alignedLines.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={`수정: ${stats.changes}`} 
                size="small" 
                sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 600, borderRadius: 1.5 }} 
              />
              <Chip 
                label={`추가: ${stats.additions}`} 
                size="small" 
                sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, borderRadius: 1.5 }} 
              />
              <Chip 
                label={`삭제: ${stats.deletions}`} 
                size="small" 
                sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600, borderRadius: 1.5 }} 
              />
            </Box>
          )}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
            color="primary"
            sx={{ bgcolor: 'white' }}
          >
            <ToggleButton value="split" sx={{ px: 1.5 }}>
              <Tooltip title="좌우 병렬 뷰">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ViewWeekIcon fontSize="small" />
                  <Typography variant="button" sx={{ display: { xs: 'none', sm: 'inline' } }}>Split</Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="unified" sx={{ px: 1.5 }}>
              <Tooltip title="상하 통합 뷰">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ViewStreamIcon fontSize="small" />
                  <Typography variant="button" sx={{ display: { xs: 'none', sm: 'inline' } }}>Unified</Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Error & Info Alerts */}
      {jsonError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setJsonError(null)}>
          {jsonError}
        </Alert>
      )}
      {copySuccess && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {copySuccess}
        </Alert>
      )}

      {/* Grid: Inputs (Upper half) & Viewers (Lower half) */}
      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        
        {/* Editor Inputs Card */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: { xs: 350, md: 0 } }}>
          <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                비교 데이터 입력
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => loadExample('text')}>텍스트 예시</Button>
                <Button size="small" variant="outlined" onClick={() => loadExample('json')}>JSON 예시</Button>
                <IconButton size="small" onClick={handleSwap} color="primary" title="좌우 데이터 교환">
                  <SwapHorizIcon />
                </IconButton>
                <IconButton size="small" onClick={handleClear} color="error" title="모두 지우기">
                  <DeleteOutlinedIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flex: 1, minHeight: 0, divideX: '1px solid #e0e0e0' }}>
              {/* Left Input */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>원본 (Original / Left)</Typography>
                  <IconButton size="small" onClick={() => handleCopy('left')} title="복사">
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Box>
                <InputBase
                  multiline
                  placeholder="여기에 원본 텍스트 또는 JSON을 붙여넣으세요..."
                  value={leftInput}
                  onChange={(e) => setLeftInput(e.target.value)}
                  sx={{
                    flex: 1,
                    fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                    fontSize: 13,
                    alignItems: 'flex-start',
                    overflow: 'auto',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    '&:focus-within': { borderColor: 'primary.main', bgcolor: 'white' }
                  }}
                  inputProps={{ style: { height: '100%', overflow: 'auto' } }}
                />
              </Box>
              
              <Divider orientation="vertical" flexItem />

              {/* Right Input */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.main' }}>비교 대상 (Modified / Right)</Typography>
                  <IconButton size="small" onClick={() => handleCopy('right')} title="복사">
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Box>
                <InputBase
                  multiline
                  placeholder="여기에 비교할 텍스트 또는 JSON을 붙여넣으세요..."
                  value={rightInput}
                  onChange={(e) => setRightInput(e.target.value)}
                  sx={{
                    flex: 1,
                    fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                    fontSize: 13,
                    alignItems: 'flex-start',
                    overflow: 'auto',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    '&:focus-within': { borderColor: 'primary.main', bgcolor: 'white' }
                  }}
                  inputProps={{ style: { height: '100%', overflow: 'auto' } }}
                />
              </Box>
            </Box>

            {/* Smart JSON Options Area */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={autoFormatJson} onChange={(e) => setAutoFormatJson(e.target.checked)} />}
                  label={<Typography variant="caption" sx={{ fontWeight: 600 }}>JSON 자동 포맷팅</Typography>}
                />
                <FormControlLabel
                  control={<Switch size="small" checked={sortJsonKeys} onChange={(e) => setSortJsonKeys(e.target.checked)} />}
                  label={<Typography variant="caption" sx={{ fontWeight: 600 }}>JSON Key 알파벳 정렬</Typography>}
                />
                <FormControlLabel
                  control={<Switch size="small" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} />}
                  label={<Typography variant="caption" sx={{ fontWeight: 600 }}>공백 무시</Typography>}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<SortByAlphaIcon />}
                  onClick={() => setSortJsonKeys(!sortJsonKeys)}
                  color={sortJsonKeys ? "primary" : "inherit"}
                >
                  Key 정렬
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  startIcon={<AutoFixHighIcon />}
                  onClick={handleBeautify}
                  sx={{ borderRadius: 1.5 }}
                >
                  JSON 정돈
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Diff Viewers Card (Right half on md/lg, or bottom on xs/sm) */}
        <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                차이점 분석 결과 ({viewMode === 'split' ? '좌우 분할 뷰' : '통합 병합 뷰'})
              </Typography>
              {alignedLines.length === 0 && (
                <Chip size="small" icon={<ErrorOutlinedIcon />} label="데이터 없음" variant="outlined" color="default" />
              )}
              {alignedLines.length > 0 && stats.additions === 0 && stats.deletions === 0 && stats.changes === 0 && (
                <Chip size="small" icon={<CheckCircleOutlinedIcon />} label="두 데이터가 완전히 일치합니다" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
              )}
            </Box>

            {/* Split View Viewer */}
            {viewMode === 'split' ? (
              <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', bgcolor: '#fafafa' }}>
                {/* Left Side (Original) */}
                <Box sx={{ flex: 1, display: 'flex', minWidth: 0, borderRight: '1px solid', borderColor: 'grey.200' }}>
                  {/* Left Line Numbers */}
                  <Box 
                    ref={leftLineNosRef}
                    sx={{ 
                      width: 48, 
                      bgcolor: 'grey.100', 
                      color: 'grey.500', 
                      fontFamily: '"Fira Code", monospace', 
                      fontSize: 12, 
                      textAlign: 'right', 
                      pr: 1.5, 
                      py: 1.5,
                      userSelect: 'none',
                      borderRight: '1px solid',
                      borderColor: 'grey.200',
                      overflow: 'hidden',
                    }}
                  >
                    {alignedLines.map((line, idx) => (
                      <Box key={idx} sx={{ height: 21, lineHeight: '21px', color: line.left.type === 'removed' ? 'error.main' : 'inherit' }}>
                        {line.left.lineNum || ''}
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Left Text content */}
                  <Box 
                    ref={leftViewerRef}
                    onScroll={(e) => handleViewerScroll(e, 'left')}
                    sx={{ 
                      flex: 1, 
                      overflow: 'auto', 
                      whiteSpace: 'pre',
                      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                      fontSize: 12.5,
                      py: 1.5,
                      px: 2,
                    }}
                  >
                    {alignedLines.map((line, idx) => {
                      const type = line.left.type
                      const bg = type === 'removed' ? '#ffebee' : type === 'empty' ? '#f4f4f4' : 'transparent'
                      const color = type === 'removed' ? '#c62828' : type === 'empty' ? 'transparent' : 'text.primary'
                      return (
                        <Box 
                          key={idx} 
                          sx={{ 
                            height: 21, 
                            lineHeight: '21px', 
                            bgcolor: bg, 
                            color: color, 
                            px: 0.5,
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { bgcolor: type === 'common' ? 'rgba(0,0,0,0.02)' : bg }
                          }}
                        >
                          <Typography component="span" sx={{ 
                            fontFamily: 'inherit', 
                            fontSize: 'inherit', 
                            color: type === 'removed' ? 'error.light' : 'transparent',
                            width: 14,
                            mr: 0.5,
                            userSelect: 'none'
                          }}>
                            {type === 'removed' ? '-' : ' '}
                          </Typography>
                          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {renderLineText(line.left)}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>

                {/* Right Side (Modified) */}
                <Box sx={{ flex: 1, display: 'flex', minWidth: 0 }}>
                  {/* Right Line Numbers */}
                  <Box 
                    ref={rightLineNosRef}
                    sx={{ 
                      width: 48, 
                      bgcolor: 'grey.100', 
                      color: 'grey.500', 
                      fontFamily: '"Fira Code", monospace', 
                      fontSize: 12, 
                      textAlign: 'right', 
                      pr: 1.5, 
                      py: 1.5,
                      userSelect: 'none',
                      borderRight: '1px solid',
                      borderColor: 'grey.200',
                      overflow: 'hidden',
                    }}
                  >
                    {alignedLines.map((line, idx) => (
                      <Box key={idx} sx={{ height: 21, lineHeight: '21px', color: line.right.type === 'added' ? 'success.main' : 'inherit' }}>
                        {line.right.lineNum || ''}
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Right Text Content */}
                  <Box 
                    ref={rightViewerRef}
                    onScroll={(e) => handleViewerScroll(e, 'right')}
                    sx={{ 
                      flex: 1, 
                      overflow: 'auto', 
                      whiteSpace: 'pre',
                      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                      fontSize: 12.5,
                      py: 1.5,
                      px: 2,
                    }}
                  >
                    {alignedLines.map((line, idx) => {
                      const type = line.right.type
                      const bg = type === 'added' ? '#e8f5e9' : type === 'empty' ? '#f4f4f4' : 'transparent'
                      const color = type === 'added' ? '#2e7d32' : type === 'empty' ? 'transparent' : 'text.primary'
                      return (
                        <Box 
                          key={idx} 
                          sx={{ 
                            height: 21, 
                            lineHeight: '21px', 
                            bgcolor: bg, 
                            color: color, 
                            px: 0.5,
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { bgcolor: type === 'common' ? 'rgba(0,0,0,0.02)' : bg }
                          }}
                        >
                          <Typography component="span" sx={{ 
                            fontFamily: 'inherit', 
                            fontSize: 'inherit', 
                            color: type === 'added' ? 'success.light' : 'transparent',
                            width: 14,
                            mr: 0.5,
                            userSelect: 'none'
                          }}>
                            {type === 'added' ? '+' : ' '}
                          </Typography>
                          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {renderLineText(line.right)}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </Box>
            ) : (
              /* Unified View Viewer */
              <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#fafafa', display: 'flex' }}>
                <Box 
                  sx={{ 
                    flex: 1, 
                    whiteSpace: 'pre',
                    fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                    fontSize: 12.5,
                    py: 1.5,
                  }}
                >
                  {alignedLines.map((line, idx) => {
                    const showLeft = line.left.type !== 'empty'
                    const showRight = line.right.type !== 'empty' && line.right.type !== 'common'
                    
                    return (
                      <Box key={idx}>
                        {/* If left line is removed, show left line */}
                        {showLeft && line.left.type === 'removed' && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              bgcolor: '#ffebee', 
                              color: '#c62828',
                              minHeight: 21,
                              lineHeight: '21px',
                              px: 2,
                              '&:hover': { bgcolor: 'rgba(239, 154, 154, 0.4)' }
                            }}
                          >
                            <Box sx={{ width: 40, color: 'error.main', textAlign: 'right', pr: 2, userSelect: 'none' }}>
                              {line.left.lineNum}
                            </Box>
                            <Box sx={{ width: 40, color: 'transparent', textAlign: 'right', pr: 2, userSelect: 'none' }}>
                              -
                            </Box>
                            <Typography component="span" sx={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'error.light', width: 14, mr: 0.5, userSelect: 'none' }}>
                              -
                            </Typography>
                            <Box component="span">
                              {renderLineText(line.left)}
                            </Box>
                          </Box>
                        )}

                        {/* If common line, show common line once */}
                        {line.left.type === 'common' && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              minHeight: 21,
                              lineHeight: '21px',
                              px: 2,
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                            }}
                          >
                            <Box sx={{ width: 40, color: 'grey.500', textAlign: 'right', pr: 2, userSelect: 'none' }}>
                              {line.left.lineNum}
                            </Box>
                            <Box sx={{ width: 40, color: 'grey.500', textAlign: 'right', pr: 2, userSelect: 'none' }}>
                              {line.right.lineNum}
                            </Box>
                            <Typography component="span" sx={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'transparent', width: 14, mr: 0.5, userSelect: 'none' }}>
                              &nbsp;
                            </Typography>
                            <Box component="span" sx={{ color: 'text.primary' }}>
                              {line.left.text}
                            </Box>
                          </Box>
                        )}

                        {/* If right line is added, show right line */}
                        {showRight && line.right.type === 'added' && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              bgcolor: '#e8f5e9', 
                              color: '#2e7d32',
                              minHeight: 21,
                              lineHeight: '21px',
                              px: 2,
                              '&:hover': { bgcolor: 'rgba(165, 214, 167, 0.4)' }
                            }}
                          >
                            <Box sx={{ width: 40, color: 'transparent', textAlign: 'right', pr: 2, userSelect: 'none' }}>
                              -
                            </Box>
                            <Box sx={{ width: 40, color: 'success.main', textAlign: 'right', pr: 2, userSelect: 'none' }}>
                              {line.right.lineNum}
                            </Box>
                            <Typography component="span" sx={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'success.light', width: 14, mr: 0.5, userSelect: 'none' }}>
                              +
                            </Typography>
                            <Box component="span">
                              {renderLineText(line.right)}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
