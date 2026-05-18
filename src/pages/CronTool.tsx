import { useState, useEffect } from 'react'
import { 
  Box, Typography, Grid, Card, CardContent, TextField, 
  Tabs, Tab, FormControlLabel, Radio, RadioGroup, Select, MenuItem, 
  Chip, Alert, InputAdornment, IconButton, Tooltip, Stack
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AlarmIcon from '@mui/icons-material/Alarm'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoIcon from '@mui/icons-material/Info'
import dayjs from 'dayjs'

// Weekday helper
const WEEKDAYS = [
  { label: '일요일', value: 0 },
  { label: '월요일', value: 1 },
  { label: '화요일', value: 2 },
  { label: '수요일', value: 3 },
  { label: '목요일', value: 4 },
  { label: '금요일', value: 5 },
  { label: '토요일', value: 6 }
]

// Month helper
const MONTHS = [
  { label: '1월', value: 1 }, { label: '2월', value: 2 }, { label: '3월', value: 3 },
  { label: '4월', value: 4 }, { label: '5월', value: 5 }, { label: '6월', value: 6 },
  { label: '7월', value: 7 }, { label: '8월', value: 8 }, { label: '9월', value: 9 },
  { label: '10월', value: 10 }, { label: '11월', value: 11 }, { label: '12월', value: 12 }
]

// Preset patterns
interface Preset {
  label: string
  cron: string
}

const PRESETS: Preset[] = [
  { label: '매 5분마다', cron: '*/5 * * * *' },
  { label: '매시간 정각', cron: '0 * * * *' },
  { label: '매일 자정 (00:00)', cron: '0 0 * * *' },
  { label: '매일 아침 9시', cron: '0 9 * * *' },
  { label: '매주 평일 아침 9시', cron: '0 9 * * 1-5' },
  { label: '매월 1일 자정', cron: '0 0 1 * *' }
]

// Weekday Translation Helper
function getWeekdayName(day: number): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
  return days[day] || ''
}

// Hours Translation Helper
function getHourString(hour: number): string {
  if (hour === 0) return '오전 12시'
  if (hour === 12) return '오후 12시'
  if (hour < 12) return `오전 ${hour}시`
  return `오후 ${hour - 12}시`
}

// Sub-part Translation Helper
function translatePart(part: string, type: 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'): string {
  // Range: a-b
  const rangeMatch = part.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10)
    const end = parseInt(rangeMatch[2], 10)
    switch (type) {
      case 'minute': return `${start}분부터 ${end}분까지 매분`
      case 'hour': return `${getHourString(start)}부터 ${getHourString(end)}까지 매시간`
      case 'dayOfMonth': return `${start}일부터 ${end}일까지 매일`
      case 'month': return `${start}월부터 ${end}월까지 매월`
      case 'dayOfWeek': return `${getWeekdayName(start)}부터 ${getWeekdayName(end)}까지 매주`
    }
  }

  // Range with step: a-b/n
  const rangeStepMatch = part.match(/^(\d+)-(\d+)\/(\d+)$/)
  if (rangeStepMatch) {
    const start = parseInt(rangeStepMatch[1], 10)
    const end = parseInt(rangeStepMatch[2], 10)
    const step = parseInt(rangeStepMatch[3], 10)
    switch (type) {
      case 'minute': return `${start}분부터 ${end}분까지 매 ${step}분마다`
      case 'hour': return `${getHourString(start)}부터 ${getHourString(end)}까지 매 ${step}시간마다`
      case 'dayOfMonth': return `${start}일부터 ${end}일까지 매 ${step}일마다`
      case 'month': return `${start}월부터 ${end}월까지 매 ${step}개월마다`
      case 'dayOfWeek': return `${getWeekdayName(start)}부터 ${getWeekdayName(end)}까지 매 ${step}주마다`
    }
  }

  // Exact step: n/step
  const exactStepMatch = part.match(/^(\d+)\/(\d+)$/)
  if (exactStepMatch) {
    const start = parseInt(exactStepMatch[1], 10)
    const step = parseInt(exactStepMatch[2], 10)
    switch (type) {
      case 'minute': return `${start}분부터 시작하여 매 ${step}분마다`
      case 'hour': return `${getHourString(start)}부터 시작하여 매 ${step}시간마다`
      case 'dayOfMonth': return `${start}일부터 시작하여 매 ${step}일마다`
      case 'month': return `${start}월부터 시작하여 매 ${step}개월마다`
      case 'dayOfWeek': return `${getWeekdayName(start)}부터 시작하여 매 ${step}주마다`
    }
  }

  const val = parseInt(part, 10)
  switch (type) {
    case 'minute': return `${val}분`
    case 'hour': return getHourString(val)
    case 'dayOfMonth': return `${val}일`
    case 'month': return `${val}월`
    case 'dayOfWeek': return getWeekdayName(val)
  }
}

// Field Translation Helper
function translateField(field: string, type: 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'): string {
  if (field === '*') {
    switch (type) {
      case 'minute': return '매분'
      case 'hour': return '매시간'
      case 'dayOfMonth': return '매일'
      case 'month': return '매월'
      case 'dayOfWeek': return '매요일'
    }
  }

  // Step: */n
  const stepMatch = field.match(/^\*\/(\d+)$/)
  if (stepMatch) {
    const val = parseInt(stepMatch[1], 10)
    switch (type) {
      case 'minute': return `매 ${val}분마다`
      case 'hour': return `매 ${val}시간마다`
      case 'dayOfMonth': return `매 ${val}일마다`
      case 'month': return `매 ${val}개월마다`
      case 'dayOfWeek': return `매 ${val}주요일마다`
    }
  }

  // List: a,b,c
  if (field.includes(',')) {
    const parts = field.split(',').map(p => translatePart(p, type))
    return parts.join(', ')
  }

  return translatePart(field, type)
}

// Compile human-readable Korean explanation
function parseCronToKorean(cron: string): string {
  const fields = cron.trim().split(/\s+/)
  if (fields.length !== 5) return '올바른 5개 필드 크론 표현식을 입력하세요.'

  const [min, hour, dom, month, dow] = fields

  // Check simple common triggers
  if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return '매분 365일 언제나 실행합니다.'
  }

  const minStr = translateField(min, 'minute')
  const hourStr = translateField(hour, 'hour')
  const domStr = translateField(dom, 'dayOfMonth')
  const monthStr = translateField(month, 'month')
  const dowStr = translateField(dow, 'dayOfWeek')

  let sentences: string[] = []

  if (month !== '*') {
    sentences.push(monthStr)
  }
  if (dom !== '*') {
    sentences.push(domStr)
  }
  if (dow !== '*') {
    sentences.push(`매주 ${dowStr}`)
  }

  // Time formatting
  if (hour !== '*' && min !== '*') {
    // Exact hour and exact minute
    if (!hour.includes(',') && !hour.includes('-') && !hour.includes('/') &&
        !min.includes(',') && !min.includes('-') && !min.includes('/')) {
      const hVal = parseInt(hour, 10)
      const mVal = parseInt(min, 10)
      if (hVal === 0 && mVal === 0) {
        sentences.push('자정(00시 00분)')
      } else if (hVal === 12 && mVal === 0) {
        sentences.push('정오(12시 00분)')
      } else {
        sentences.push(`${getHourString(hVal)} ${mVal}분`)
      }
    } else {
      sentences.push(`${hourStr}의 ${minStr}`)
    }
  } else {
    if (hour !== '*') sentences.push(hourStr)
    if (min !== '*') sentences.push(minStr)
  }

  return `${sentences.join(' ')}에 실행합니다.`
}

// Validate cron structure
function validateCron(cron: string): string | null {
  const fields = cron.trim().split(/\s+/)
  if (fields.length !== 5) {
    return '크론 표현식은 공백으로 구분된 5개의 필드 (분 시 일 월 요일) 여야 합니다.'
  }

  const limits = [
    { name: '분 (Minutes)', min: 0, max: 59 },
    { name: '시 (Hours)', min: 0, max: 23 },
    { name: '일 (Day of Month)', min: 1, max: 31 },
    { name: '월 (Month)', min: 1, max: 12 },
    { name: '요일 (Day of Week)', min: 0, max: 7 }
  ]

  for (let i = 0; i < 5; i++) {
    const field = fields[i]
    const { name, min, max } = limits[i]

    if (!/^[0-9*,\/\-]+$/.test(field)) {
      return `${name} 필드에 올바르지 않은 문자 형식이 있습니다. 숫자, *, ,, /, -만 사용 가능합니다.`
    }

    const parts = field.split(',')
    for (const part of parts) {
      if (part === '*') continue

      // Step check (e.g. */5)
      if (part.includes('/')) {
        const [range, stepStr] = part.split('/')
        if (!stepStr || isNaN(Number(stepStr))) {
          return `${name} 필드: 올바르지 않은 주기(/) 형식입니다.`
        }
        const step = Number(stepStr)
        if (step <= 0) {
          return `${name} 필드: 주기 값은 1 이상이어야 합니다.`
        }
        if (range !== '*') {
          if (range.includes('-')) {
            const [s, e] = range.split('-').map(Number)
            if (isNaN(s) || isNaN(e) || s < min || e > max || s > e) {
              return `${name} 필드: 주기 기호 앞의 범위(${range})가 유효하지 않습니다.`
            }
          } else {
            const val = Number(range)
            if (isNaN(val) || val < min || val > max) {
              return `${name} 필드: 주기 기호 앞의 값(${range})이 유효 범위를 벗어났습니다.`
            }
          }
        }
        continue
      }

      // Range check (e.g. 1-5)
      if (part.includes('-')) {
        const [s, e] = part.split('-').map(Number)
        if (isNaN(s) || isNaN(e)) {
          return `${name} 필드: 범위(-) 형식이 올바르지 않습니다.`
        }
        if (s < min || s > max || e < min || e > max) {
          return `${name} 필드: 범위(${part})가 올바른 범위(${min} ~ ${max})를 벗어났습니다.`
        }
        if (s > e) {
          return `${name} 필드: 범위 시작값(${s})은 종료값(${e})보다 작아야 합니다.`
        }
        continue
      }

      // Exact number check
      const val = Number(part)
      if (isNaN(val)) {
        return `${name} 필드: 숫자 포맷이 올바르지 않습니다.`
      }
      if (val < min || val > max) {
        return `${name} 필드: 값(${val})이 허용 범위(${min} ~ ${max})를 벗어났습니다.`
      }
    }
  }

  return null
}

// Utility to parse field string into Set of numbers
function parseFieldValues(field: string, minLimit: number, maxLimit: number, type: 'dow' | 'other' = 'other'): Set<number> {
  const result = new Set<number>()
  const parts = field.split(',')

  for (const part of parts) {
    if (part === '*') {
      for (let i = minLimit; i <= maxLimit; i++) {
        result.add(i)
      }
    } else if (part.includes('/')) {
      const [range, stepStr] = part.split('/')
      const step = parseInt(stepStr, 10) || 1
      let start = minLimit
      let end = maxLimit

      if (range !== '*') {
        if (range.includes('-')) {
          const [s, e] = range.split('-').map(Number)
          start = s
          end = e
        } else {
          start = parseInt(range, 10)
        }
      }

      for (let i = start; i <= end; i += step) {
        if (i >= minLimit && i <= maxLimit) {
          result.add(i)
        }
      }
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      for (let i = start; i <= end; i++) {
        if (i >= minLimit && i <= maxLimit) {
          result.add(i)
        }
      }
    } else {
      let val = parseInt(part, 10)
      if (type === 'dow' && val === 7) {
        val = 0 // Standard sunday maps to 0 as well
      }
      if (val >= minLimit && val <= maxLimit) {
        result.add(val)
      }
    }
  }
  return result
}

// Predict next 5 executions
function getNextExecutions(cron: string, count = 5): Date[] {
  const fields = cron.trim().split(/\s+/)
  if (fields.length !== 5) return []

  // Check validation
  if (validateCron(cron)) return []

  const minutes = parseFieldValues(fields[0], 0, 59)
  const hours = parseFieldValues(fields[1], 0, 23)
  const daysOfMonth = parseFieldValues(fields[2], 1, 31)
  const months = parseFieldValues(fields[3], 1, 12)
  const daysOfWeek = parseFieldValues(fields[4], 0, 6, 'dow')

  const results: Date[] = []
  let current = new Date()

  // Zero seconds/milliseconds, round to next minute
  current.setSeconds(0)
  current.setMilliseconds(0)
  current.setMinutes(current.getMinutes() + 1)

  const maxSearchYear = current.getFullYear() + 5
  let iterations = 0

  while (results.length < count && current.getFullYear() < maxSearchYear && iterations < 50000) {
    iterations++

    const m = current.getMonth() + 1
    if (!months.has(m)) {
      current.setMonth(current.getMonth() + 1)
      current.setDate(1)
      current.setHours(0)
      current.setMinutes(0)
      continue
    }

    const dom = current.getDate()
    if (!daysOfMonth.has(dom)) {
      current.setDate(current.getDate() + 1)
      current.setHours(0)
      current.setMinutes(0)
      continue
    }

    const dow = current.getDay()
    if (!daysOfWeek.has(dow)) {
      current.setDate(current.getDate() + 1)
      current.setHours(0)
      current.setMinutes(0)
      continue
    }

    const h = current.getHours()
    if (!hours.has(h)) {
      current.setHours(current.getHours() + 1)
      current.setMinutes(0)
      continue
    }

    const min = current.getMinutes()
    if (!minutes.has(min)) {
      current.setMinutes(current.getMinutes() + 1)
      continue
    }

    // All elements match!
    results.push(new Date(current))
    current.setMinutes(current.getMinutes() + 1)
  }

  return results
}

export default function CronTool() {
  const [cronExpression, setCronExpression] = useState('*/5 * * * *')
  const [activeTab, setActiveTab] = useState('minutes')
  const [copySuccess, setCopySuccess] = useState(false)
  const [koreanExplanation, setKoreanExplanation] = useState('')
  const [nextExecutions, setNextExecutions] = useState<Date[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  // Sub-forms state management
  const [minuteInterval, setMinuteInterval] = useState(5)
  
  const [hourlyMode, setHourlyMode] = useState<'every' | 'exact'>('every')
  const [hourInterval, setHourInterval] = useState(1)
  const [hourlyMinute, setHourlyMinute] = useState(0)

  const [dailyMode, setDailyMode] = useState<'every' | 'exact'>('every')
  const [dailyInterval, setDailyInterval] = useState(1)
  const [dailyHour, setDailyHour] = useState(9)
  const [dailyMinute, setDailyMinute] = useState(0)

  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri
  const [weeklyHour, setWeeklyHour] = useState(9)
  const [weeklyMinute, setWeeklyMinute] = useState(0)

  const [monthlyMonths, setMonthlyMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  const [monthlyDay, setMonthlyDay] = useState(1)
  const [monthlyHour, setMonthlyHour] = useState(0)
  const [monthlyMinute, setMonthlyMinute] = useState(0)

  const [customFields, setCustomFields] = useState({
    minutes: '*/5',
    hours: '*',
    dom: '*',
    months: '*',
    dow: '*'
  })

  // Synchronize Sub-form selections to Cron string
  useEffect(() => {
    let cron = '* * * * *'

    switch (activeTab) {
      case 'minutes':
        cron = `*/${minuteInterval} * * * *`
        break
      case 'hourly':
        if (hourlyMode === 'every') {
          cron = `${hourlyMinute} */${hourInterval} * * *`
        } else {
          cron = `${hourlyMinute} * * * *`
        }
        break
      case 'daily':
        if (dailyMode === 'every') {
          cron = `${dailyMinute} ${dailyHour} */${dailyInterval} * *`
        } else {
          cron = `${dailyMinute} ${dailyHour} * * *`
        }
        break
      case 'weekly':
        const dowString = weeklyDays.length === 0 ? '*' : weeklyDays.sort().join(',')
        cron = `${weeklyMinute} ${weeklyHour} * * ${dowString}`
        break
      case 'monthly':
        const monthString = monthlyMonths.length === 12 ? '*' : monthlyMonths.sort((a,b)=>a-b).join(',')
        cron = `${monthlyMinute} ${monthlyHour} ${monthlyDay} ${monthString} *`
        break
      case 'custom':
        cron = `${customFields.minutes} ${customFields.hours} ${customFields.dom} ${customFields.months} ${customFields.dow}`
        break
    }

    setCronExpression(cron)
  }, [
    activeTab, minuteInterval, hourlyMode, hourInterval, hourlyMinute,
    dailyMode, dailyInterval, dailyHour, dailyMinute, weeklyDays,
    weeklyHour, weeklyMinute, monthlyMonths, monthlyDay, monthlyHour,
    monthlyMinute, customFields
  ])

  // Synchronize Cron String modifications back to UI Parser and validations
  useEffect(() => {
    const error = validateCron(cronExpression)
    setValidationError(error)

    if (!error) {
      setKoreanExplanation(parseCronToKorean(cronExpression))
      setNextExecutions(getNextExecutions(cronExpression))
    } else {
      setKoreanExplanation('')
      setNextExecutions([])
    }
  }, [cronExpression])

  // Synchronize external preset clicks to states
  const handleApplyPreset = (cron: string) => {
    setCronExpression(cron)
    
    // Attempt to map to custom inputs or keep in custom tab
    const fields = cron.trim().split(/\s+/)
    if (fields.length === 5) {
      setCustomFields({
        minutes: fields[0],
        hours: fields[1],
        dom: fields[2],
        months: fields[3],
        dow: fields[4]
      })
      setActiveTab('custom')
    }
  }

  // Handle Checkbox Toggles for Days of Week and Months
  const handleWeekdayToggle = (value: number) => {
    if (weeklyDays.includes(value)) {
      setWeeklyDays(weeklyDays.filter(d => d !== value))
    } else {
      setWeeklyDays([...weeklyDays, value])
    }
  }

  const handleMonthToggle = (value: number) => {
    if (monthlyMonths.includes(value)) {
      setMonthlyMonths(monthlyMonths.filter(m => m !== value))
    } else {
      setMonthlyMonths([...monthlyMonths, value])
    }
  }

  // Action: Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpression)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Title block */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AlarmIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Cron Generator & Parser
          </Typography>
        </Box>
      </Box>

      {/* Preset template tags */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontWeight: 600 }}>
          빠른 프리셋:
        </Typography>
        {PRESETS.map((preset) => (
          <Chip 
            key={preset.label} 
            label={preset.label} 
            onClick={() => handleApplyPreset(preset.cron)}
            variant="outlined"
            clickable
            color="primary"
            sx={{ borderRadius: 1.5, '&:hover': { bgcolor: 'primary.50' } }}
          />
        ))}
      </Box>

      {/* Two Column Grid */}
      <Grid container spacing={3}>
        
        {/* Left column - visual generator cards */}
        <Grid size={{ xs: 12, lg: 7.5 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header bar */}
            <Box sx={{ 
              p: 1.5, 
              borderBottom: '1px solid', 
              borderColor: 'divider', 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'grey.50' 
            }}>
              <Tabs 
                value={activeTab} 
                onChange={(_, val) => setActiveTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0.5, fontWeight: 600 } }}
              >
                <Tab label="매 분" value="minutes" />
                <Tab label="매 시간" value="hourly" />
                <Tab label="매 일" value="daily" />
                <Tab label="매 주" value="weekly" />
                <Tab label="매 월" value="monthly" />
                <Tab label="고급 커스텀" value="custom" />
              </Tabs>
            </Box>

            {/* Tab content forms */}
            <CardContent sx={{ p: 3, flex: 1 }}>
              
              {/* Tabs 1: Minutes */}
              {activeTab === 'minutes' && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    매 특정 분 주기마다 반복합니다.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">작업 실행 주기:</Typography>
                    <Select
                      value={minuteInterval}
                      onChange={(e) => setMinuteInterval(Number(e.target.value))}
                      size="small"
                      sx={{ width: 120 }}
                    >
                      {[1, 2, 3, 5, 10, 15, 20, 30].map(val => (
                        <MenuItem key={val} value={val}>매 {val}분</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="body2" color="text.secondary">마다 작업을 반복해서 실행합니다.</Typography>
                  </Box>
                </Stack>
              )}

              {/* Tabs 2: Hourly */}
              {activeTab === 'hourly' && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    매 시간 단위의 주기를 지정하여 반복합니다.
                  </Typography>
                  <RadioGroup 
                    value={hourlyMode} 
                    onChange={(e) => setHourlyMode(e.target.value as 'every' | 'exact')}
                  >
                    <FormControlLabel 
                      value="every" 
                      control={<Radio size="small" />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">매</Typography>
                          <Select
                            value={hourInterval}
                            onChange={(e) => setHourInterval(Number(e.target.value))}
                            disabled={hourlyMode !== 'every'}
                            size="small"
                            sx={{ width: 100 }}
                          >
                            {[1, 2, 3, 4, 6, 8, 12].map(val => (
                              <MenuItem key={val} value={val}>{val}시간</MenuItem>
                            ))}
                          </Select>
                          <Typography variant="body2">마다 실행</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel 
                      value="exact" 
                      control={<Radio size="small" />} 
                      label={<Typography variant="body2">매시간 실행</Typography>} 
                      sx={{ mt: 1.5 }}
                    />
                  </RadioGroup>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="body2">상세 시작 시간:</Typography>
                    <Select
                      value={hourlyMinute}
                      onChange={(e) => setHourlyMinute(Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                    >
                      {Array.from({ length: 60 }).map((_, i) => (
                        <MenuItem key={i} value={i}>{i}분</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="body2" color="text.secondary">정각에 해당 작업을 시작합니다.</Typography>
                  </Box>
                </Stack>
              )}

              {/* Tabs 3: Daily */}
              {activeTab === 'daily' && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    매일 실행할 상세 일시 주기를 구성합니다.
                  </Typography>
                  <RadioGroup 
                    value={dailyMode} 
                    onChange={(e) => setDailyMode(e.target.value as 'every' | 'exact')}
                  >
                    <FormControlLabel 
                      value="every" 
                      control={<Radio size="small" />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">매</Typography>
                          <Select
                            value={dailyInterval}
                            onChange={(e) => setDailyInterval(Number(e.target.value))}
                            disabled={dailyMode !== 'every'}
                            size="small"
                            sx={{ width: 100 }}
                          >
                            {Array.from({ length: 30 }).map((_, i) => (
                              <MenuItem key={i + 1} value={i + 1}>{i + 1}일</MenuItem>
                            ))}
                          </Select>
                          <Typography variant="body2">마다 실행</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel 
                      value="exact" 
                      control={<Radio size="small" />} 
                      label={<Typography variant="body2">매일 실행</Typography>} 
                      sx={{ mt: 1.5 }}
                    />
                  </RadioGroup>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="body2">실행 시간:</Typography>
                    <Select
                      value={dailyHour}
                      onChange={(e) => setDailyHour(Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <MenuItem key={i} value={i}>{String(i).padStart(2, '0')}시</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="body2">:</Typography>
                    <Select
                      value={dailyMinute}
                      onChange={(e) => setDailyMinute(Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                    >
                      {Array.from({ length: 60 }).map((_, i) => (
                        <MenuItem key={i} value={i}>{String(i).padStart(2, '0')}분</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Stack>
              )}

              {/* Tabs 4: Weekly */}
              {activeTab === 'weekly' && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    선택한 요일들을 기반으로 주간 실행 스케줄을 만듭니다.
                  </Typography>
                  
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>실행할 요일 선택 (다중 가능):</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {WEEKDAYS.map((day) => {
                        const isSelected = weeklyDays.includes(day.value)
                        return (
                          <Chip
                            key={day.value}
                            label={day.label}
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            onClick={() => handleWeekdayToggle(day.value)}
                            clickable
                            sx={{ fontWeight: isSelected ? 600 : 400 }}
                          />
                        )
                      })}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="body2">실행 예정 시각:</Typography>
                    <Select
                      value={weeklyHour}
                      onChange={(e) => setWeeklyHour(Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <MenuItem key={i} value={i}>{String(i).padStart(2, '0')}시</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="body2">:</Typography>
                    <Select
                      value={weeklyMinute}
                      onChange={(e) => setWeeklyMinute(Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                    >
                      {Array.from({ length: 60 }).map((_, i) => (
                        <MenuItem key={i} value={i}>{String(i).padStart(2, '0')}분</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Stack>
              )}

              {/* Tabs 5: Monthly */}
              {activeTab === 'monthly' && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    월간 스케줄 및 특정 일자를 지정하여 실행합니다.
                  </Typography>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>실행할 월 선택 (다중 가능):</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {MONTHS.map((m) => {
                        const isSelected = monthlyMonths.includes(m.value)
                        return (
                          <Chip
                            key={m.value}
                            label={m.label}
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            onClick={() => handleMonthToggle(m.value)}
                            clickable
                            sx={{ fontWeight: isSelected ? 600 : 400 }}
                          />
                        )
                      })}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1 }}>
                    <Typography variant="body2">실행할 일자 지정:</Typography>
                    <Select
                      value={monthlyDay}
                      onChange={(e) => setMonthlyDay(Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                    >
                      {Array.from({ length: 31 }).map((_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>{i + 1}일</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="body2" color="text.secondary">일에 작업을 실행합니다.</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="body2">실행 예정 시각:</Typography>
                    <Select
                      value={monthlyHour}
                      onChange={(e) => setMonthlyHour(Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <MenuItem key={i} value={i}>{String(i).padStart(2, '0')}시</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="body2">:</Typography>
                    <Select
                      value={monthlyMinute}
                      onChange={(e) => setMonthlyMinute(Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                    >
                      {Array.from({ length: 60 }).map((_, i) => (
                        <MenuItem key={i} value={i}>{String(i).padStart(2, '0')}분</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Stack>
              )}

              {/* Tabs 6: Custom */}
              {activeTab === 'custom' && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    개별 크론 필드(Minutes, Hours, Day of Month, Month, Day of Week)를 직접 커스텀 입력하여 구성합니다.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4, lg: 2.4 }}>
                      <TextField
                        label="분 (Minute)"
                        value={customFields.minutes}
                        onChange={(e) => setCustomFields({ ...customFields, minutes: e.target.value })}
                        helperText="0-59 (예: *, */5, 0)"
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, lg: 2.4 }}>
                      <TextField
                        label="시 (Hour)"
                        value={customFields.hours}
                        onChange={(e) => setCustomFields({ ...customFields, hours: e.target.value })}
                        helperText="0-23 (예: *, 9-17, 0)"
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, lg: 2.4 }}>
                      <TextField
                        label="일 (Day of Month)"
                        value={customFields.dom}
                        onChange={(e) => setCustomFields({ ...customFields, dom: e.target.value })}
                        helperText="1-31 (예: *, 1, 15)"
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                      <TextField
                        label="월 (Month)"
                        value={customFields.months}
                        onChange={(e) => setCustomFields({ ...customFields, months: e.target.value })}
                        helperText="1-12 (예: *, */2, 1-6)"
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                      <TextField
                        label="요일 (Day of Week)"
                        value={customFields.dow}
                        onChange={(e) => setCustomFields({ ...customFields, dow: e.target.value })}
                        helperText="0-6 (0=일요일, 1-5=평일)"
                        size="small"
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 1 }}>
                    와일드카드 팁: <strong>*</strong> (모든 값), <strong>,</strong> (값 리스트 구분), <strong>-</strong> (값 범위 지정), <strong>/</strong> (주기 설정)을 자유롭게 혼합하여 작성하실 수 있습니다.
                  </Alert>
                </Stack>
              )}

            </CardContent>
          </Card>
        </Grid>

        {/* Right column - parsing, raw display and prediction */}
        <Grid size={{ xs: 12, lg: 4.5 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            
            {/* Output Display Card */}
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <Box sx={{ 
                p: 1.5, 
                borderBottom: '1px solid', 
                borderColor: 'divider', 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'grey.50' 
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  최종 Cron 표현식
                </Typography>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {activeTab !== 'custom' ? (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.100', 
                    borderRadius: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main', letterSpacing: '2px' }}>
                      {cronExpression}
                    </Typography>
                    <Tooltip title={copySuccess ? '복사 완료!' : '클립보드 복사'}>
                      <IconButton onClick={handleCopy} color={copySuccess ? 'success' : 'primary'}>
                        {copySuccess ? <CheckCircleIcon /> : <ContentCopyIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    label="직접 수정 가능"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '2px' } }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={copySuccess ? '복사 완료!' : '클립보드 복사'}>
                              <IconButton onClick={handleCopy} color={copySuccess ? 'success' : 'primary'} edge="end">
                                {copySuccess ? <CheckCircleIcon /> : <ContentCopyIcon />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Parsing Translation Card */}
            <Card variant="outlined" sx={{ borderRadius: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                p: 1.5, 
                borderBottom: '1px solid', 
                borderColor: 'divider', 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'grey.50' 
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  자연어 해석 및 유효성 검사
                </Typography>
              </Box>

              <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {validationError ? (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {validationError}
                  </Alert>
                ) : (
                  <Box sx={{ 
                    p: 2, 
                    borderLeft: '4px solid', 
                    borderColor: 'success.main', 
                    bgcolor: 'success.50',
                    borderRadius: 1
                  }}>
                    <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      한국어 설명
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.6 }}>
                      {koreanExplanation}
                    </Typography>
                  </Box>
                )}

                {/* Timeline Next Predictions */}
                {!validationError && nextExecutions.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5 }}>
                      다음 5회 실행 예정 시각:
                    </Typography>
                    <Stack spacing={1.5}>
                      {nextExecutions.map((date, index) => {
                        const formatted = dayjs(date).format('YYYY-MM-DD (dd) HH:mm:00')
                        return (
                          <Box 
                            key={index}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              p: 1.5, 
                              bgcolor: 'white', 
                              border: '1px solid',
                              borderColor: 'grey.100',
                              borderRadius: 2,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: 'primary.light',
                                bgcolor: 'primary.50'
                              }
                            }}
                          >
                            <Box sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              bgcolor: 'primary.100', 
                              color: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {index + 1}
                            </Box>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.primary' }}>
                              {formatted}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>

          </Stack>
        </Grid>

      </Grid>
    </Box>
  )
}
