const dayjs = require('dayjs');

function convertPythonToDayjs(formatStr) {
  const tokenMap = {
    '%Y': 'YYYY', '%y': 'YY', '%m': 'MM', '%B': 'MMMM', '%b': 'MMM', '%h': 'MMM',
    '%d': 'DD', '%A': 'dddd', '%a': 'ddd', '%H': 'HH', '%I': 'hh', '%M': 'mm',
    '%S': 'ss', '%f': 'SSS', '%p': 'A', '%z': 'Z', '%%': '[%]'
  };
  
  let result = '';
  const regex = /(%[a-zA-Z%])|([^%]+)|(%)/g;
  
  let match;
  while ((match = regex.exec(formatStr)) !== null) {
    if (match[1]) {
      if (tokenMap[match[1]]) {
        result += tokenMap[match[1]];
      } else {
        result += '[' + match[1] + ']';
      }
    } else if (match[2]) {
      result += match[2].replace(/([A-Za-z]+)/g, '[$1]');
    } else if (match[3]) {
      result += '[%]';
    }
  }
  return result;
}

function convertJavaToDayjs(formatStr) {
  // Java mapping
  const tokenMap = {
    'yyyy': 'YYYY', 'yy': 'YY', 'MMMM': 'MMMM', 'MMM': 'MMM', 'MM': 'MM',
    'dd': 'DD', 'EEEE': 'dddd', 'EEE': 'ddd', 'HH': 'HH', 'hh': 'hh',
    'mm': 'mm', 'ss': 'ss', 'SSS': 'SSS', 'a': 'A', 'Z': 'Z'
  };
  
  // Sort keys by length descending to match longest first
  const keys = Object.keys(tokenMap).sort((a, b) => b.length - a.length);
  // Match tokens or literal letters
  const regexStr = '(' + keys.join('|') + ')|([A-Za-z]+)|([^A-Za-z]+)';
  const regex = new RegExp(regexStr, 'g');
  
  let result = '';
  let match;
  while ((match = regex.exec(formatStr)) !== null) {
    if (match[1]) {
      result += tokenMap[match[1]];
    } else if (match[2]) {
      // Literal letters
      result += '[' + match[2] + ']';
    } else if (match[3]) {
      // Non-letters
      result += match[3];
    }
  }
  return result;
}

console.log("python mapped:", convertPythonToDayjs("%Y-%m-%d %H:%M:%S %z Z yyyy"));
console.log("python eval:", dayjs().format(convertPythonToDayjs("%Y-%m-%d %H:%M:%S %z Z yyyy")));
console.log("java mapped:", convertJavaToDayjs("yyyy-MM-dd HH:mm:ss Z Z YYYY"));
console.log("java eval:", dayjs().format(convertJavaToDayjs("yyyy-MM-dd HH:mm:ss Z Z YYYY")));
