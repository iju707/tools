const dayjs = require('dayjs');

function convertPythonToDayjs(formatStr) {
  const tokenMap = {
    '%Y': 'YYYY', '%y': 'YY', '%m': 'MM', '%B': 'MMMM', '%b': 'MMM', '%h': 'MMM',
    '%d': 'DD', '%A': 'dddd', '%a': 'ddd', '%H': 'HH', '%I': 'hh', '%M': 'mm',
    '%S': 'ss', '%f': 'SSS', '%p': 'A', '%z': 'Z', '%%': '%'
  };
  
  // Match python tokens or literals
  let result = '';
  // regex matches % followed by letter or %, OR any other character
  const regex = /(%[a-zA-Z%])|([^%]+)|(%)/g;
  
  let match;
  while ((match = regex.exec(formatStr)) !== null) {
    if (match[1]) {
      // It's a token like %Y or %%
      if (tokenMap[match[1]]) {
        result += tokenMap[match[1]];
      } else {
        // Unknown token, treat as literal but escape
        result += '[' + match[1] + ']';
      }
    } else if (match[2]) {
      // It's a literal chunk
      // Escape letters for dayjs by wrapping in []
      result += match[2].replace(/([A-Za-z]+)/g, '[$1]');
    } else if (match[3]) {
      // Dangling %
      result += '[%]';
    }
  }
  return result;
}

console.log("python:", convertPythonToDayjs("%Y-%m-%d %H:%M:%S %z Z"));
console.log("evaluated:", dayjs().format(convertPythonToDayjs("%Y-%m-%d %H:%M:%S %z Z")));
