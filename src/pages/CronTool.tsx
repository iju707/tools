/* eslint-disable react-hooks/set-state-in-effect */
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

export type CronMode = 'standard' | 'spring' | 'aws' | 'quartz'

interface Preset {
  label: string
  cron: string
}

const PRESETS_BY_MODE: Record<CronMode, Preset[]> = {
  standard: [
    { label: '매 5분마다', cron: '*/5 * * * *' },
    { label: '매시간 정각', cron: '0 * * * *' },
    { label: '매일 자정 (00:00)', cron: '0 0 * * *' },
    { label: '매일 아침 9시', cron: '0 9 * * *' },
    { label: '매주 평일 아침 9시', cron: '0 9 * * 1-5' },
    { label: '매월 1일 자정', cron: '0 0 1 * *' }
  ],
  spring: [
    { label: '매 10초마다', cron: '*/10 * * * * *' },
    { label: '매 30초마다', cron: '*/30 * * * * *' },
    { label: '매분 0초 정각', cron: '0 * * * * *' },
    { label: '매시간 정각 (0초)', cron: '0 0 * * * *' },
    { label: '매일 새벽 2시 정각', cron: '0 0 2 * * *' },
    { label: '매주 평일 아침 9시', cron: '0 0 9 * * 1-5' }
  ],
  aws: [
    { label: '매 5분마다', cron: '*/5 * * * ? *' },
    { label: '매시간 정각', cron: '0 * * * ? *' },
    { label: '매일 자정 (00:00)', cron: '0 0 * * ? *' },
    { label: '매일 아침 9시', cron: '0 9 * * ? *' },
    { label: '매주 평일 아침 9시', cron: '0 9 ? * MON-FRI *' },
    { label: '매월 1일 자정', cron: '0 0 1 * ? *' }
  ],
  quartz: [
    { label: '매 5초마다', cron: '*/5 * * * * ? *' },
    { label: '매 10초마다', cron: '*/10 * * * * ? *' },
    { label: '매분 0초 정각', cron: '0 * * * * ? *' },
    { label: '매시간 정각 (0초)', cron: '0 0 * * * ? *' },
    { label: '매일 새벽 2시 정각', cron: '0 0 2 * * ? *' },
    { label: '매주 평일 아침 9시', cron: '0 0 9 ? * MON-FRI *' }
  ]
}

// DOW name maps
const DOW_NAMES_MAP: Record<string, string> = {
  'SUN': '일요일', 'MON': '월요일', 'TUE': '화요일', 'WED': '수요일', 'THU': '목요일', 'FRI': '금요일', 'SAT': '토요일'
}

const MONTH_NAMES_MAP: Record<string, string> = {
  'JAN': '1월', 'FEB': '2월', 'MAR': '3월', 'APR': '4월', 'MAY': '5월', 'JUN': '6월',
  'JUL': '7월', 'AUG': '8월', 'SEP': '9월', 'OCT': '10월', 'NOV': '11월', 'DEC': '12월'
}

function getWeekdayNameByVal(val: number, isOneBased: boolean): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  if (isOneBased) {
    // 1=SUN, 2=MON, ..., 7=SAT
    return days[(val - 1) % 7] || ''
  } else {
    // 0=SUN, 1=MON, ..., 6=SAT, 7=SUN
    return days[val % 7] || ''
  }
}

// Hours Translation Helper
function getHourString(hour: number): string {
  if (hour === 0) return '오전 12시'
  if (hour === 12) return '오후 12시'
  if (hour < 12) return `오전 ${hour}시`
  return `오후 ${hour - 12}시`
}

// Sub-part Translation Helper
function translatePart(
  part: string, 
  type: 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek' | 'year',
  isOneBasedDow: boolean
): string {
  const clean = part.toUpperCase()

  // ? symbol
  if (clean === '?') return ''

  // W symbol (closest weekday)
  if (type === 'dayOfMonth' && clean.endsWith('W')) {
    if (clean === 'LW') return '마지막 평일'
    const day = clean.slice(0, -1)
    return `${day}일과 가장 가까운 평일`
  }

  // L symbol (last day of month or last DOW)
  if (clean === 'L') {
    if (type === 'dayOfMonth') return '마지막 날'
    if (type === 'dayOfWeek') return '마지막 요일'
  }
  if (type === 'dayOfMonth' && clean.startsWith('L-')) {
    const offset = clean.substring(2)
    return `마지막 날 ${offset}일 전`
  }
  if (type === 'dayOfWeek' && clean.endsWith('L')) {
    const dowStr = clean.slice(0, -1)
    const dowNum = parseInt(dowStr, 10)
    const dowName = !isNaN(dowNum)
      ? getWeekdayNameByVal(dowNum, isOneBasedDow)
      : (DOW_NAMES_MAP[dowStr] || dowStr)
    return `마지막 ${dowName}`
  }

  // Hash symbol (#) for DOW (e.g. 6#3 or FRI#3)
  if (type === 'dayOfWeek' && clean.includes('#')) {
    const [dowStr, nthStr] = clean.split('#')
    const dowNum = parseInt(dowStr, 10)
    const dowName = !isNaN(dowNum)
      ? getWeekdayNameByVal(dowNum, isOneBasedDow)
      : (DOW_NAMES_MAP[dowStr] || dowStr)
    return `${nthStr}번째 ${dowName}`
  }

  // Convert name strings to numeric representation/readable text if exact match
  if (type === 'dayOfWeek' && DOW_NAMES_MAP[clean]) {
    return DOW_NAMES_MAP[clean]
  }
  if (type === 'month' && MONTH_NAMES_MAP[clean]) {
    return MONTH_NAMES_MAP[clean]
  }

  // Range: a-b
  if (clean.includes('-')) {
    const [startStr, endStr] = clean.split('-')
    const startVal = parseInt(startStr, 10)
    const endVal = parseInt(endStr, 10)

    let start = isNaN(startVal) ? (type === 'dayOfWeek' ? DOW_NAMES_MAP[startStr] || startStr : type === 'month' ? MONTH_NAMES_MAP[startStr] || startStr : startStr) : startVal
    let end = isNaN(endVal) ? (type === 'dayOfWeek' ? DOW_NAMES_MAP[endStr] || endStr : type === 'month' ? MONTH_NAMES_MAP[endStr] || endStr : endStr) : endVal

    if (typeof start === 'number') {
      if (type === 'dayOfWeek') start = getWeekdayNameByVal(start, isOneBasedDow)
      else if (type === 'month') start = `${start}월`
      else if (type === 'hour') start = getHourString(start)
      else if (type === 'second') start = `${start}초`
      else if (type === 'minute') start = `${start}분`
      else if (type === 'dayOfMonth') start = `${start}일`
      else if (type === 'year') start = `${start}년`
    }
    if (typeof end === 'number') {
      if (type === 'dayOfWeek') end = getWeekdayNameByVal(end, isOneBasedDow)
      else if (type === 'month') end = `${end}월`
      else if (type === 'hour') end = getHourString(end)
      else if (type === 'second') end = `${end}초`
      else if (type === 'minute') end = `${end}분`
      else if (type === 'dayOfMonth') end = `${end}일`
      else if (type === 'year') end = `${end}년`
    }

    return `${start}부터 ${end}까지`
  }

  // Range with step: a-b/n or exact-step: a/n
  if (clean.includes('/')) {
    const [range, stepStr] = clean.split('/')
    const step = parseInt(stepStr, 10)
    
    if (range === '*') {
      switch (type) {
        case 'second': return `매 ${step}초마다`
        case 'minute': return `매 ${step}분마다`
        case 'hour': return `매 ${step}시간마다`
        case 'dayOfMonth': return `매 ${step}일마다`
        case 'month': return `매 ${step}개월마다`
        case 'dayOfWeek': return `매 ${step}주마다`
        case 'year': return `매 ${step}년마다`
      }
    }

    // range contains start-end
    if (range.includes('-')) {
      const [startStr, endStr] = range.split('-')
      const startVal = parseInt(startStr, 10)
      const endVal = parseInt(endStr, 10)

      let start = isNaN(startVal) ? (type === 'dayOfWeek' ? DOW_NAMES_MAP[startStr] || startStr : type === 'month' ? MONTH_NAMES_MAP[startStr] || startStr : startStr) : startVal
      let end = isNaN(endVal) ? (type === 'dayOfWeek' ? DOW_NAMES_MAP[endStr] || endStr : type === 'month' ? MONTH_NAMES_MAP[endStr] || endStr : endStr) : endVal

      if (typeof start === 'number') {
        if (type === 'dayOfWeek') start = getWeekdayNameByVal(start, isOneBasedDow)
        else if (type === 'month') start = `${start}월`
        else if (type === 'hour') start = getHourString(start)
        else if (type === 'second') start = `${start}초`
        else if (type === 'minute') start = `${start}분`
        else if (type === 'dayOfMonth') start = `${start}일`
        else if (type === 'year') start = `${start}년`
      }
      if (typeof end === 'number') {
        if (type === 'dayOfWeek') end = getWeekdayNameByVal(end, isOneBasedDow)
        else if (type === 'month') end = `${end}월`
        else if (type === 'hour') end = getHourString(end)
        else if (type === 'second') end = `${end}초`
        else if (type === 'minute') end = `${end}분`
        else if (type === 'dayOfMonth') end = `${end}일`
        else if (type === 'year') end = `${end}년`
      }

      switch (type) {
        case 'second': return `${start}부터 ${end}까지 매 ${step}초마다`
        case 'minute': return `${start}부터 ${end}까지 매 ${step}분마다`
        case 'hour': return `${start}부터 ${end}까지 매 ${step}시간마다`
        case 'dayOfMonth': return `${start}부터 ${end}까지 매 ${step}일마다`
        case 'month': return `${start}부터 ${end}까지 매 ${step}개월마다`
        case 'dayOfWeek': return `${start}부터 ${end}까지 매 ${step}주마다`
        case 'year': return `${start}부터 ${end}까지 매 ${step}년마다`
      }
    } else {
      // Single start value
      const startVal = parseInt(range, 10)
      let start = isNaN(startVal) ? (type === 'dayOfWeek' ? DOW_NAMES_MAP[range] || range : type === 'month' ? MONTH_NAMES_MAP[range] || range : range) : startVal

      if (typeof start === 'number') {
        if (type === 'dayOfWeek') start = getWeekdayNameByVal(start, isOneBasedDow)
        else if (type === 'month') start = `${start}월`
        else if (type === 'hour') start = getHourString(start)
        else if (type === 'second') start = `${start}초`
        else if (type === 'minute') start = `${start}분`
        else if (type === 'dayOfMonth') start = `${start}일`
        else if (type === 'year') start = `${start}년`
      }

      switch (type) {
        case 'second': return `${start}부터 매 ${step}초마다`
        case 'minute': return `${start}부터 매 ${step}분마다`
        case 'hour': return `${start}부터 매 ${step}시간마다`
        case 'dayOfMonth': return `${start}부터 매 ${step}일마다`
        case 'month': return `${start}부터 매 ${step}개월마다`
        case 'dayOfWeek': return `${start}부터 매 ${step}주마다`
        case 'year': return `${start}부터 매 ${step}년마다`
      }
    }
  }

  // Exact single value
  const val = parseInt(clean, 10)
  if (isNaN(val)) {
    return clean
  }

  switch (type) {
    case 'second': return `${val}초`
    case 'minute': return `${val}분`
    case 'hour': return getHourString(val)
    case 'dayOfMonth': return `${val}일`
    case 'month': return `${val}월`
    case 'dayOfWeek': return getWeekdayNameByVal(val, isOneBasedDow)
    case 'year': return `${val}년`
  }
}

// Field Translation Helper
function translateField(
  field: string, 
  type: 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek' | 'year',
  isOneBasedDow: boolean
): string {
  const clean = field.trim().toUpperCase()

  if (clean === '*' || clean === '?') {
    switch (type) {
      case 'second': return ''
      case 'minute': return '매분'
      case 'hour': return '매시간'
      case 'dayOfMonth': return '매일'
      case 'month': return '매월'
      case 'dayOfWeek': return '매요일'
      case 'year': return ''
    }
  }

  // Step: */n
  const stepMatch = clean.match(/^[*?]\/(\d+)$/)
  if (stepMatch) {
    const val = parseInt(stepMatch[1], 10)
    switch (type) {
      case 'second': return `매 ${val}초마다`
      case 'minute': return `매 ${val}분마다`
      case 'hour': return `매 ${val}시간마다`
      case 'dayOfMonth': return `매 ${val}일마다`
      case 'month': return `매 ${val}개월마다`
      case 'dayOfWeek': return `매 ${val}주요일마다`
      case 'year': return `매 ${val}년마다`
    }
  }

  // List: a,b,c
  if (clean.includes(',')) {
    const parts = clean.split(',').map(p => translatePart(p, type, isOneBasedDow)).filter(Boolean)
    return parts.join(', ')
  }

  return translatePart(clean, type, isOneBasedDow)
}

// Compile human-readable Korean explanation
function parseCronToKorean(cron: string, mode: CronMode): string {
  const error = validateCron(cron, mode)
  if (error) return `올바르지 않은 크론 표현식: ${error}`

  const fields = cron.trim().split(/\s+/)
  
  let sec = '0'
  let min = '*'
  let hour = '*'
  let dom = '*'
  let month = '*'
  let dow = '*'
  let year = '*'

  if (mode === 'standard') {
    [min, hour, dom, month, dow] = fields
  } else if (mode === 'spring') {
    [sec, min, hour, dom, month, dow] = fields
  } else if (mode === 'aws') {
    [min, hour, dom, month, dow, year] = fields
  } else if (mode === 'quartz') {
    [sec, min, hour, dom, month, dow, year] = fields
  }

  const isOneBasedDow = (mode === 'aws' || mode === 'quartz')

  // Check all *
  const allWildcards = (sec === '0' || sec === '*') && min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*' && (year === '*' || year === '?')
  if (allWildcards) {
    return '매분 365일 언제나 실행합니다.'
  }

  const secStr = translateField(sec, 'second', isOneBasedDow)
  const minStr = translateField(min, 'minute', isOneBasedDow)
  const hourStr = translateField(hour, 'hour', isOneBasedDow)
  const domStr = translateField(dom, 'dayOfMonth', isOneBasedDow)
  const monthStr = translateField(month, 'month', isOneBasedDow)
  const dowStr = translateField(dow, 'dayOfWeek', isOneBasedDow)
  const yearStr = translateField(year, 'year', isOneBasedDow)

  const sentences: string[] = []

  if (year !== '*' && year !== '?') {
    sentences.push(`${yearStr}의`)
  }
  if (month !== '*' && month !== '?') {
    sentences.push(monthStr)
  }
  if (dom !== '*' && dom !== '?') {
    sentences.push(domStr)
  }
  if (dow !== '*' && dow !== '?') {
    if (dow.includes('#') || dow.endsWith('L')) {
      sentences.push(dowStr)
    } else {
      sentences.push(`매주 ${dowStr}`)
    }
  }

  // Time & Seconds formatting
  const hasSpecificSeconds = sec !== '0' && sec !== '*' && sec !== '?'
  const hasSpecificMinutes = min !== '*' && min !== '?'
  const hasSpecificHours = hour !== '*' && hour !== '?'

  if (hasSpecificHours && hasSpecificMinutes) {
    // Exact hour, exact minute, exact second
    const isSimpleHour = !hour.includes(',') && !hour.includes('-') && !hour.includes('/')
    const isSimpleMinute = !min.includes(',') && !min.includes('-') && !min.includes('/')
    const isSimpleSecond = !sec.includes(',') && !sec.includes('-') && !sec.includes('/')

    if (isSimpleHour && isSimpleMinute && (!hasSpecificSeconds || isSimpleSecond)) {
      const hVal = parseInt(hour, 10)
      const mVal = parseInt(min, 10)
      const sVal = parseInt(sec, 10)

      let timePart: string
      if (hVal === 0 && mVal === 0 && sVal === 0) {
        timePart = '자정(00시 00분 00초)'
      } else if (hVal === 12 && mVal === 0 && sVal === 0) {
        timePart = '정오(12시 00분 00초)'
      } else {
        timePart = `${getHourString(hVal)} ${mVal}분${hasSpecificSeconds ? ` ${sVal}초` : ''}`
      }
      sentences.push(timePart)
    } else {
      const timePart = `${hourStr}의 ${minStr}${hasSpecificSeconds ? ` ${secStr}` : ''}`
      sentences.push(timePart)
    }
  } else {
    if (hour !== '*' && hour !== '?') sentences.push(hourStr)
    if (min !== '*' && min !== '?') sentences.push(minStr)
    if (hasSpecificSeconds) sentences.push(secStr)
  }

  // Cleanup spaces and format final sentence
  const finalDesc = sentences.filter(Boolean).join(' ')
  if (!finalDesc) return '실행 조건이 지정되지 않았습니다.'

  return `${finalDesc}에 실행합니다.`
}

interface FieldLimit {
  name: string
  min: number
  max: number
  allowQuestion: boolean
  allowL: boolean
  allowW: boolean
  allowHash: boolean
}

function parseCronPartValue(part: string, limit: FieldLimit): number {
  const clean = part.toUpperCase()
  
  // Handle SUN-SAT for Day of Week
  if (limit.name.includes('요일')) {
    const dowNames: Record<string, number> = {
      'SUN': 1, 'MON': 2, 'TUE': 3, 'WED': 4, 'THU': 5, 'FRI': 6, 'SAT': 7
    }
    const standardDowNames: Record<string, number> = {
      'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
    }
    const map = (limit.min === 0) ? standardDowNames : dowNames
    if (map[clean] !== undefined) return map[clean]
  }
  
  // Handle JAN-DEC for Month
  if (limit.name.includes('월')) {
    const monthNames: Record<string, number> = {
      'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
      'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
    }
    if (monthNames[clean] !== undefined) return monthNames[clean]
  }

  return Number(part)
}

function validatePart(part: string, limit: FieldLimit): string | null {
  const { name, min, max, allowQuestion, allowL, allowW, allowHash } = limit
  const clean = part.toUpperCase()

  // 1. Check special single characters
  if (clean === '*') return null
  if (clean === '?' && allowQuestion) return null
  if (clean === 'L' && allowL) return null

  // 2. Check W symbol (DOM only, e.g. 15W, LW)
  if (allowW && (clean === 'LW' || /^\d+W$/.test(clean))) {
    if (clean !== 'LW') {
      const val = parseInt(clean, 10)
      if (val < min || val > max) {
        return `${name} 필드: W 기호 앞의 값(${val})이 허용 범위를 벗어났습니다.`
      }
    }
    return null
  }

  // 3. Check L with offset (DOM only, e.g. L-3)
  if (allowL && /^L-\d+$/.test(clean)) {
    const val = parseInt(clean.substring(2), 10)
    if (val < 1 || val > 30) {
      return `${name} 필드: L 오프셋 값(${val})이 범위를 벗어났습니다.`
    }
    return null
  }

  // 4. Check L at DOW (e.g. 5L or FRIL)
  if (allowL && name.includes('요일') && /^[1-7]L$/.test(clean)) {
    return null
  }
  if (allowL && name.includes('요일') && /^(SUN|MON|TUE|WED|THU|FRI|SAT)L$/.test(clean)) {
    return null
  }

  // 5. Check Hash symbol (DOW only, e.g. 6#3 or FRI#3)
  if (allowHash && /^[1-7]#[1-5]$/.test(clean)) {
    return null
  }
  if (allowHash && /^(SUN|MON|TUE|WED|THU|FRI|SAT)#[1-5]$/.test(clean)) {
    return null
  }

  // 6. Step check (e.g. */5, 1-15/3, MON-FRI/2)
  if (clean.includes('/')) {
    const [range, stepStr] = clean.split('/')
    if (!stepStr || isNaN(Number(stepStr))) {
      return `${name} 필드: 올바르지 않은 주기(/) 형식입니다.`
    }
    const step = Number(stepStr)
    if (step <= 0) {
      return `${name} 필드: 주기 값은 1 이상이어야 합니다.`
    }
    if (range !== '*') {
      if (range.includes('-')) {
        const [sStr, eStr] = range.split('-')
        const s = parseCronPartValue(sStr, limit)
        const e = parseCronPartValue(eStr, limit)
        if (isNaN(s) || isNaN(e) || s < min || e > max || s > e) {
          return `${name} 필드: 주기 기호 앞의 범위(${range})가 유효하지 않습니다.`
        }
      } else {
        const val = parseCronPartValue(range, limit)
        if (isNaN(val) || val < min || val > max) {
          return `${name} 필드: 주기 기호 앞의 값(${range})이 유효 범위를 벗어났습니다.`
        }
      }
    }
    return null
  }

  // 7. Range check (e.g. 1-5, MON-FRI)
  if (clean.includes('-')) {
    const [sStr, eStr] = clean.split('-')
    const s = parseCronPartValue(sStr, limit)
    const e = parseCronPartValue(eStr, limit)
    if (isNaN(s) || isNaN(e)) {
      return `${name} 필드: 범위(-) 형식이 올바르지 않습니다.`
    }
    if (s < min || s > max || e < min || e > max) {
      return `${name} 필드: 범위(${part})가 올바른 범위(${min} ~ ${max})를 벗어났습니다.`
    }
    if (s > e) {
      return `${name} 필드: 범위 시작값(${s})은 종료값(${e})보다 작아야 합니다.`
    }
    return null
  }

  // 8. Exact value check (e.g. 5, MON)
  const val = parseCronPartValue(clean, limit)
  if (isNaN(val)) {
    return `${name} 필드: 올바르지 않은 포맷(${part})입니다.`
  }
  if (val < min || val > max) {
    return `${name} 필드: 값(${val})이 허용 범위(${min} ~ ${max})를 벗어났습니다.`
  }

  return null
}

// Validate cron structure
function validateCron(cron: string, mode: CronMode): string | null {
  const fields = cron.trim().split(/\s+/)
  
  let expectedLength = 5
  let modeName = '표준 Linux/Unix'
  let fieldsLabel = '분 시 일 월 요일'
  if (mode === 'spring') {
    expectedLength = 6
    modeName = 'Spring Scheduler'
    fieldsLabel = '초 분 시 일 월 요일'
  } else if (mode === 'aws') {
    expectedLength = 6
    modeName = 'AWS EventBridge'
    fieldsLabel = '분 시 일 월 요일 연도'
  } else if (mode === 'quartz') {
    expectedLength = 7
    modeName = 'Quartz Scheduler'
    fieldsLabel = '초 분 시 일 월 요일 연도'
  }

  if (fields.length !== expectedLength) {
    return `${modeName} 크론 표현식은 공백으로 구분된 ${expectedLength}개의 필드 (${fieldsLabel}) 여야 합니다.`
  }

  // Check AWS / Quartz mutual exclusivity of DOM and DOW
  if (mode === 'aws' || mode === 'quartz') {
    const domField = mode === 'aws' ? fields[2] : fields[3]
    const dowField = mode === 'aws' ? fields[4] : fields[5]
    if (domField !== '?' && dowField !== '?') {
      return `${modeName} 규격에서는 일(Day of Month)과 요일(Day of Week) 중 하나는 반드시 '?' 여야 합니다.`
    }
    if (domField === '?' && dowField === '?') {
      return `${modeName} 규격에서는 일(Day of Month)과 요일(Day of Week)이 모두 '?' 일 수 없습니다.`
    }
  }

  let limits: FieldLimit[]
  if (mode === 'standard') {
    limits = [
      { name: '분 (Minutes)', min: 0, max: 59, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '시 (Hours)', min: 0, max: 23, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '일 (Day of Month)', min: 1, max: 31, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '월 (Month)', min: 1, max: 12, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '요일 (Day of Week)', min: 0, max: 7, allowQuestion: false, allowL: false, allowW: false, allowHash: false }
    ]
  } else if (mode === 'spring') {
    limits = [
      { name: '초 (Seconds)', min: 0, max: 59, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '분 (Minutes)', min: 0, max: 59, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '시 (Hours)', min: 0, max: 23, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '일 (Day of Month)', min: 1, max: 31, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '월 (Month)', min: 1, max: 12, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '요일 (Day of Week)', min: 0, max: 7, allowQuestion: false, allowL: false, allowW: false, allowHash: false }
    ]
  } else if (mode === 'aws') {
    limits = [
      { name: '분 (Minutes)', min: 0, max: 59, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '시 (Hours)', min: 0, max: 23, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '일 (Day of Month)', min: 1, max: 31, allowQuestion: true, allowL: true, allowW: true, allowHash: false },
      { name: '월 (Month)', min: 1, max: 12, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '요일 (Day of Week)', min: 1, max: 7, allowQuestion: true, allowL: true, allowW: false, allowHash: false },
      { name: '연도 (Year)', min: 1970, max: 2099, allowQuestion: false, allowL: false, allowW: false, allowHash: false }
    ]
  } else { // quartz
    limits = [
      { name: '초 (Seconds)', min: 0, max: 59, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '분 (Minutes)', min: 0, max: 59, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '시 (Hours)', min: 0, max: 23, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '일 (Day of Month)', min: 1, max: 31, allowQuestion: true, allowL: true, allowW: true, allowHash: false },
      { name: '월 (Month)', min: 1, max: 12, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
      { name: '요일 (Day of Week)', min: 1, max: 7, allowQuestion: true, allowL: true, allowW: false, allowHash: true },
      { name: '연도 (Year)', min: 1970, max: 2099, allowQuestion: false, allowL: false, allowW: false, allowHash: false }
    ]
  }

  for (let i = 0; i < expectedLength; i++) {
    const field = fields[i]
    const limit = limits[i]

    if (!new RegExp('^[0-9*,/?LW#A-Za-z-]+$').test(field)) {
      return `${limit.name} 필드에 올바르지 않은 문자 형식이 있습니다. 숫자, *, ,, /, -, ?, L, W, # 및 알파벳명만 사용 가능합니다.`
    }

    const parts = field.split(',')
    for (const part of parts) {
      const err = validatePart(part, limit)
      if (err) return err
    }
  }

  return null
}

function matchField(val: number, field: string, limit: FieldLimit, dateContext?: Date): boolean {
  if (field === '*' || field === '?') return true;
  const parts = field.split(',');
  for (const part of parts) {
    if (matchPart(val, part, limit, dateContext)) return true;
  }
  return false;
}

function matchPart(val: number, part: string, limit: FieldLimit, dateContext?: Date): boolean {
  const clean = part.toUpperCase();
  if (clean === '*') return true;
  if (clean === '?' && limit.allowQuestion) return true;

  // L for DOM
  if (clean === 'L' && limit.allowL && limit.name.includes('일')) {
    if (dateContext) {
      const lastDay = new Date(dateContext.getFullYear(), dateContext.getMonth() + 1, 0).getDate();
      return val === lastDay;
    }
    return false;
  }

  // L-offset for DOM (e.g. L-3)
  if (clean.startsWith('L-') && limit.allowL && limit.name.includes('일')) {
    const offset = parseInt(clean.substring(2), 10);
    if (dateContext && !isNaN(offset)) {
      const lastDay = new Date(dateContext.getFullYear(), dateContext.getMonth() + 1, 0).getDate();
      return val === (lastDay - offset);
    }
    return false;
  }

  // W for DOM (e.g. 15W, LW)
  if (clean.endsWith('W') && limit.allowW && limit.name.includes('일') && dateContext) {
    const year = dateContext.getFullYear();
    const month = dateContext.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    const targetDay = clean === 'LW' ? lastDay : parseInt(clean.slice(0, -1), 10);
    
    if (isNaN(targetDay)) return false;
    
    const targetDate = new Date(year, month, targetDay);
    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 6 = Sat
    
    let actualDay = targetDay;
    if (dayOfWeek === 0) { // Sunday -> Monday
      if (targetDay === lastDay) {
        actualDay = targetDay - 2;
      } else {
        actualDay = targetDay + 1;
      }
    } else if (dayOfWeek === 6) { // Saturday -> Friday
      if (targetDay === 1) {
        actualDay = 3;
      } else {
        actualDay = targetDay - 1;
      }
    }
    return val === actualDay;
  }

  // L for DOW (e.g. 5L or FRIL)
  if (clean.endsWith('L') && limit.allowL && limit.name.includes('요일') && dateContext) {
    const dowStr = clean.slice(0, -1);
    const dowNum = parseCronPartValue(dowStr, limit);
    if (!isNaN(dowNum)) {
      const currentDow = dateContext.getDay();
      const isOneBased = (limit.min === 1);
      const standardDowNum = isOneBased ? (dowNum === 1 ? 0 : dowNum - 1) : (dowNum === 7 ? 0 : dowNum);
      
      if (currentDow !== standardDowNum) return false;
      
      const nextWeekDate = new Date(dateContext.getFullYear(), dateContext.getMonth(), dateContext.getDate() + 7);
      return nextWeekDate.getMonth() !== dateContext.getMonth();
    }
    return false;
  }

  // Hash symbol for DOW (e.g. 6#3 or FRI#3)
  if (clean.includes('#') && limit.allowHash && limit.name.includes('요일') && dateContext) {
    const [dowStr, nthStr] = clean.split('#');
    const dowNum = parseCronPartValue(dowStr, limit);
    const nth = parseInt(nthStr, 10);
    if (!isNaN(dowNum) && !isNaN(nth)) {
      const currentDow = dateContext.getDay();
      const isOneBased = (limit.min === 1);
      const standardDowNum = isOneBased ? (dowNum === 1 ? 0 : dowNum - 1) : (dowNum === 7 ? 0 : dowNum);
      
      if (currentDow !== standardDowNum) return false;
      
      const dom = dateContext.getDate();
      const calculatedNth = Math.ceil(dom / 7);
      return calculatedNth === nth;
    }
    return false;
  }

  // Step: a/n or */n or range/n
  if (clean.includes('/')) {
    const [range, stepStr] = clean.split('/');
    const step = parseInt(stepStr, 10) || 1;
    let start = limit.min;
    let end = limit.max;

    if (range !== '*') {
      if (range.includes('-')) {
        const [sStr, eStr] = range.split('-');
        start = parseCronPartValue(sStr, limit);
        end = parseCronPartValue(eStr, limit);
      } else {
        start = parseCronPartValue(range, limit);
      }
    }

    if (val < start || val > end) return false;
    return (val - start) % step === 0;
  }

  // Range: a-b
  if (clean.includes('-')) {
    const [sStr, eStr] = clean.split('-');
    const s = parseCronPartValue(sStr, limit);
    const e = parseCronPartValue(eStr, limit);
    return val >= s && val <= e;
  }

  // Exact match
  const exact = parseCronPartValue(clean, limit);
  if (limit.name.includes('요일') && limit.min === 0) {
    const standardVal = (exact === 7) ? 0 : exact;
    const standardInputVal = (val === 7) ? 0 : val;
    return standardInputVal === standardVal;
  }
  return val === exact;
}

// Predict next 5 executions
function getNextExecutions(cron: string, mode: CronMode, count = 5): Date[] {
  const error = validateCron(cron, mode)
  if (error) return []

  const fields = cron.trim().split(/\s+/)
  
  let sec = '0'
  let min = '*'
  let hour = '*'
  let dom = '*'
  let month = '*'
  let dow = '*'
  let year = '*'

  if (mode === 'standard') {
    [min, hour, dom, month, dow] = fields
  } else if (mode === 'spring') {
    [sec, min, hour, dom, month, dow] = fields
  } else if (mode === 'aws') {
    [min, hour, dom, month, dow, year] = fields
  } else if (mode === 'quartz') {
    [sec, min, hour, dom, month, dow, year] = fields
  }

  const limits: Record<string, FieldLimit> = {
    sec: { name: '초 (Seconds)', min: 0, max: 59, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
    min: { name: '분 (Minutes)', min: 0, max: 59, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
    hour: { name: '시 (Hours)', min: 0, max: 23, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
    dom: { name: '일 (Day of Month)', min: 1, max: 31, allowQuestion: (mode === 'aws' || mode === 'quartz'), allowL: (mode === 'aws' || mode === 'quartz'), allowW: (mode === 'aws' || mode === 'quartz'), allowHash: false },
    month: { name: '월 (Month)', min: 1, max: 12, allowQuestion: false, allowL: false, allowW: false, allowHash: false },
    dow: { name: '요일 (Day of Week)', min: (mode === 'aws' || mode === 'quartz') ? 1 : 0, max: (mode === 'aws' || mode === 'quartz') ? 7 : 7, allowQuestion: (mode === 'aws' || mode === 'quartz'), allowL: (mode === 'aws' || mode === 'quartz'), allowW: false, allowHash: (mode === 'quartz') },
    year: { name: '연도 (Year)', min: 1970, max: 2099, allowQuestion: false, allowL: false, allowW: false, allowHash: false }
  }

  const results: Date[] = []
  const current = new Date()
  const hasSeconds = (mode === 'spring' || mode === 'quartz')
  
  current.setMilliseconds(0)
  if (hasSeconds) {
    current.setSeconds(current.getSeconds() + 1)
  } else {
    current.setSeconds(0)
    current.setMinutes(current.getMinutes() + 1)
  }

  const maxSearchYear = 2099
  let iterations = 0
  const maxIterations = hasSeconds ? 300000 : 50000

  while (results.length < count && current.getFullYear() <= maxSearchYear && iterations < maxIterations) {
    iterations++

    const y = current.getFullYear()
    if (year !== '*' && year !== '?') {
      if (!matchField(y, year, limits.year, current)) {
        current.setFullYear(y + 1)
        current.setMonth(0)
        current.setDate(1)
        current.setHours(0)
        current.setMinutes(0)
        current.setSeconds(0)
        continue
      }
    }

    const m = current.getMonth() + 1
    if (month !== '*' && month !== '?') {
      if (!matchField(m, month, limits.month, current)) {
        current.setMonth(current.getMonth() + 1)
        current.setDate(1)
        current.setHours(0)
        current.setMinutes(0)
        current.setSeconds(0)
        continue
      }
    }

    const d = current.getDate()
    if (dom !== '*' && dom !== '?') {
      if (!matchField(d, dom, limits.dom, current)) {
        current.setDate(current.getDate() + 1)
        current.setHours(0)
        current.setMinutes(0)
        current.setSeconds(0)
        continue
      }
    }

    const standardDOW = current.getDay()
    const dowValueToCheck = (mode === 'aws' || mode === 'quartz') 
      ? (standardDOW === 0 ? 1 : standardDOW + 1) 
      : standardDOW;

    if (dow !== '*' && dow !== '?') {
      if (!matchField(dowValueToCheck, dow, limits.dow, current)) {
        current.setDate(current.getDate() + 1)
        current.setHours(0)
        current.setMinutes(0)
        current.setSeconds(0)
        continue
      }
    }

    const h = current.getHours()
    if (hour !== '*' && hour !== '?') {
      if (!matchField(h, hour, limits.hour, current)) {
        current.setHours(current.getHours() + 1)
        current.setMinutes(0)
        current.setSeconds(0)
        continue
      }
    }

    const minVal = current.getMinutes()
    if (min !== '*' && min !== '?') {
      if (!matchField(minVal, min, limits.min, current)) {
        current.setMinutes(current.getMinutes() + 1)
        current.setSeconds(0)
        continue
      }
    }

    if (hasSeconds) {
      const sVal = current.getSeconds()
      if (sec !== '*' && sec !== '?') {
        if (!matchField(sVal, sec, limits.sec, current)) {
          current.setSeconds(current.getSeconds() + 1)
          continue
        }
      }
    }

    results.push(new Date(current))
    if (hasSeconds) {
      current.setSeconds(current.getSeconds() + 1)
    } else {
      current.setMinutes(current.getMinutes() + 1)
    }
  }

  return results
}

export default function CronTool() {
  const [cronMode, setCronMode] = useState<CronMode>('standard')
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
    seconds: '0',
    minutes: '*/5',
    hours: '*',
    dom: '*',
    months: '*',
    dow: '*',
    years: '*'
  })

  // Synchronize Sub-form selections to Cron string
  useEffect(() => {
    let sec = '0'
    let min = '*'
    let hour = '*'
    let dom = '*'
    let month = '*'
    let dow = '*'
    let year = '*'

    const isAwsOrQuartz = (cronMode === 'aws' || cronMode === 'quartz')

    switch (activeTab) {
      case 'minutes':
        min = `*/${minuteInterval}`
        if (isAwsOrQuartz) dow = '?'
        break
      case 'hourly':
        min = `${hourlyMinute}`
        hour = hourlyMode === 'every' ? `*/${hourInterval}` : '*'
        if (isAwsOrQuartz) dow = '?'
        break
      case 'daily':
        min = `${dailyMinute}`
        hour = `${dailyHour}`
        dom = dailyMode === 'every' ? `*/${dailyInterval}` : '*'
        if (isAwsOrQuartz) dow = '?'
        break
      case 'weekly': {
        min = `${weeklyMinute}`
        hour = `${weeklyHour}`
        dom = isAwsOrQuartz ? '?' : '*'
        const mappedWeekly = weeklyDays.map(d => isAwsOrQuartz ? (d === 0 ? 1 : d + 1) : d).sort((a, b) => a - b)
        dow = mappedWeekly.length === 0 ? '*' : mappedWeekly.join(',')
        break
      }
      case 'monthly': {
        min = `${monthlyMinute}`
        hour = `${monthlyHour}`
        dom = `${monthlyDay}`
        const sortedMonths = [...monthlyMonths].sort((a, b) => a - b)
        month = sortedMonths.length === 12 ? '*' : sortedMonths.join(',')
        dow = isAwsOrQuartz ? '?' : '*'
        break
      }
      case 'custom':
        sec = customFields.seconds || '0'
        min = customFields.minutes || '*'
        hour = customFields.hours || '*'
        dom = customFields.dom || '*'
        month = customFields.months || '*'
        dow = customFields.dow || '*'
        year = customFields.years || '*'
        break
    }

    let cronParts: string[] = []
    if (cronMode === 'standard') {
      cronParts = [min, hour, dom, month, dow]
    } else if (cronMode === 'spring') {
      cronParts = [sec, min, hour, dom, month, dow]
    } else if (cronMode === 'aws') {
      cronParts = [min, hour, dom, month, dow, year]
    } else if (cronMode === 'quartz') {
      cronParts = [sec, min, hour, dom, month, dow, year]
    }

    setCronExpression(cronParts.join(' '))
  }, [
    activeTab, cronMode, minuteInterval, hourlyMode, hourInterval, hourlyMinute,
    dailyMode, dailyInterval, dailyHour, dailyMinute, weeklyDays,
    weeklyHour, weeklyMinute, monthlyMonths, monthlyDay, monthlyHour,
    monthlyMinute, customFields
  ])

  // Synchronize Cron String modifications back to UI Parser and validations
  useEffect(() => {
    const error = validateCron(cronExpression, cronMode)
    setValidationError(error)

    if (!error) {
      setKoreanExplanation(parseCronToKorean(cronExpression, cronMode))
      setNextExecutions(getNextExecutions(cronExpression, cronMode))

      // Sync back to customFields
      const parts = cronExpression.trim().split(/\s+/)
      let newFields = { ...customFields }
      if (cronMode === 'standard' && parts.length === 5) {
        newFields = {
          seconds: '0',
          minutes: parts[0],
          hours: parts[1],
          dom: parts[2],
          months: parts[3],
          dow: parts[4],
          years: '*'
        }
      } else if (cronMode === 'spring' && parts.length === 6) {
        newFields = {
          seconds: parts[0],
          minutes: parts[1],
          hours: parts[2],
          dom: parts[3],
          months: parts[4],
          dow: parts[5],
          years: '*'
        }
      } else if (cronMode === 'aws' && parts.length === 6) {
        newFields = {
          seconds: '0',
          minutes: parts[0],
          hours: parts[1],
          dom: parts[2],
          months: parts[3],
          dow: parts[4],
          years: parts[5]
        }
      } else if (cronMode === 'quartz' && parts.length === 7) {
        newFields = {
          seconds: parts[0],
          minutes: parts[1],
          hours: parts[2],
          dom: parts[3],
          months: parts[4],
          dow: parts[5],
          years: parts[6]
        }
      }

      if (
        newFields.seconds !== customFields.seconds ||
        newFields.minutes !== customFields.minutes ||
        newFields.hours !== customFields.hours ||
        newFields.dom !== customFields.dom ||
        newFields.months !== customFields.months ||
        newFields.dow !== customFields.dow ||
        newFields.years !== customFields.years
      ) {
        setCustomFields(newFields)
      }
    } else {
      setKoreanExplanation('')
      setNextExecutions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cronExpression, cronMode, activeTab])

  // Synchronize external preset clicks to states
  const handleApplyPreset = (cron: string) => {
    setCronExpression(cron)
    
    // Attempt to map to custom inputs or keep in custom tab
    const fields = cron.trim().split(/\s+/)
    if (fields.length === 5) {
      setCustomFields({
        seconds: '0',
        minutes: fields[0],
        hours: fields[1],
        dom: fields[2],
        months: fields[3],
        dow: fields[4],
        years: '*'
      })
      setActiveTab('custom')
    } else if (fields.length === 6) {
      if (cronMode === 'spring') {
        setCustomFields({
          seconds: fields[0],
          minutes: fields[1],
          hours: fields[2],
          dom: fields[3],
          months: fields[4],
          dow: fields[5],
          years: '*'
        })
      } else if (cronMode === 'aws') {
        setCustomFields({
          seconds: '0',
          minutes: fields[0],
          hours: fields[1],
          dom: fields[2],
          months: fields[3],
          dow: fields[4],
          years: fields[5]
        })
      }
      setActiveTab('custom')
    } else if (fields.length === 7) {
      setCustomFields({
        seconds: fields[0],
        minutes: fields[1],
        hours: fields[2],
        dom: fields[3],
        months: fields[4],
        dow: fields[5],
        years: fields[6]
      })
      setActiveTab('custom')
    }
  }

  const handleModeChange = (mode: CronMode) => {
    setCronMode(mode)
    const defaultPreset = PRESETS_BY_MODE[mode][0].cron
    setCronExpression(defaultPreset)
    
    const fields = defaultPreset.trim().split(/\s+/)
    if (mode === 'standard') {
      setCustomFields({
        seconds: '0',
        minutes: fields[0],
        hours: fields[1],
        dom: fields[2],
        months: fields[3],
        dow: fields[4],
        years: '*'
      })
    } else if (mode === 'spring') {
      setCustomFields({
        seconds: fields[0],
        minutes: fields[1],
        hours: fields[2],
        dom: fields[3],
        months: fields[4],
        dow: fields[5],
        years: '*'
      })
    } else if (mode === 'aws') {
      setCustomFields({
        seconds: '0',
        minutes: fields[0],
        hours: fields[1],
        dom: fields[2],
        months: fields[3],
        dow: fields[4],
        years: fields[5]
      })
    } else if (mode === 'quartz') {
      setCustomFields({
        seconds: fields[0],
        minutes: fields[1],
        hours: fields[2],
        dom: fields[3],
        months: fields[4],
        dow: fields[5],
        years: fields[6]
      })
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AlarmIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Cron Generator & Parser
          </Typography>
        </Box>
        
        {/* Mode Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            크론 규격:
          </Typography>
          <Select
            value={cronMode}
            onChange={(e) => handleModeChange(e.target.value as CronMode)}
            size="small"
            sx={{ 
              minWidth: 220,
              bgcolor: 'background.paper',
              borderRadius: 2,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              '& .MuiSelect-select': { py: 1 }
            }}
          >
            <MenuItem value="standard">표준 Linux/Unix (5필드)</MenuItem>
            <MenuItem value="spring">Spring Scheduler (6필드)</MenuItem>
            <MenuItem value="aws">AWS EventBridge (6필드)</MenuItem>
            <MenuItem value="quartz">Quartz Scheduler (7필드)</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Preset template tags */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontWeight: 600 }}>
          빠른 프리셋:
        </Typography>
        {PRESETS_BY_MODE[cronMode].map((preset) => (
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
                    {(cronMode === 'spring' || cronMode === 'quartz') && (
                      <Grid size={{ xs: 12, sm: 4, md: 3, lg: 1.7 }}>
                        <TextField
                          label="초 (Second)"
                          value={customFields.seconds}
                          onChange={(e) => setCustomFields({ ...customFields, seconds: e.target.value })}
                          helperText="0-59 (예: *, */10, 0)"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 4, md: 3, lg: (cronMode === 'spring' || cronMode === 'quartz' || cronMode === 'aws') ? 1.7 : 2.4 }}>
                      <TextField
                        label="분 (Minute)"
                        value={customFields.minutes}
                        onChange={(e) => setCustomFields({ ...customFields, minutes: e.target.value })}
                        helperText="0-59 (예: *, */5, 0)"
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 3, lg: (cronMode === 'spring' || cronMode === 'quartz' || cronMode === 'aws') ? 1.7 : 2.4 }}>
                      <TextField
                        label="시 (Hour)"
                        value={customFields.hours}
                        onChange={(e) => setCustomFields({ ...customFields, hours: e.target.value })}
                        helperText="0-23 (예: *, 9-17, 0)"
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 3, lg: (cronMode === 'spring' || cronMode === 'quartz' || cronMode === 'aws') ? 1.7 : 2.4 }}>
                      <TextField
                        label="일 (Day of Month)"
                        value={customFields.dom}
                        onChange={(e) => setCustomFields({ ...customFields, dom: e.target.value })}
                        helperText={(cronMode === 'aws' || cronMode === 'quartz') ? "1-31, ?, L, W (예: *, ?, L)" : "1-31 (예: *, 1, 15)"}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 3, lg: (cronMode === 'spring' || cronMode === 'quartz' || cronMode === 'aws') ? 1.7 : 2.4 }}>
                      <TextField
                        label="월 (Month)"
                        value={customFields.months}
                        onChange={(e) => setCustomFields({ ...customFields, months: e.target.value })}
                        helperText="1-12 (예: *, */2, 1-6)"
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 3, lg: (cronMode === 'spring' || cronMode === 'quartz' || cronMode === 'aws') ? 1.7 : 2.4 }}>
                      <TextField
                        label="요일 (Day of Week)"
                        value={customFields.dow}
                        onChange={(e) => setCustomFields({ ...customFields, dow: e.target.value })}
                        helperText={(cronMode === 'aws' || cronMode === 'quartz') ? "1-7, ?, L, # (예: ?, MON-FRI)" : "0-7 (0/7=일, 1-5=평일)"}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    {(cronMode === 'aws' || cronMode === 'quartz') && (
                      <Grid size={{ xs: 12, sm: 4, md: 3, lg: 1.7 }}>
                        <TextField
                          label="연도 (Year)"
                          value={customFields.years}
                          onChange={(e) => setCustomFields({ ...customFields, years: e.target.value })}
                          helperText="1970-2099 (예: *, 2026)"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                    )}
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
                        const formatted = dayjs(date).format('YYYY-MM-DD (dd) HH:mm:ss')
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
