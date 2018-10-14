// We start by tokenizing our input by declaring a function named tokenizer()
function tokenizer(input) {
  // variable current will be our index counter
  var current = 0;
  // tokens will be holding all the tokens we found in our input
  var tokens = [];

  // some regex for later use
  var LETTERS = /[a-zA-Z]/;
  var NEWLINE = /\n/;
  var BACKSLASH = /\\/;
  var WHITESPACE = /\s/;
  var NUMBERS = /[0-9]/;

  // now we start looping through each character of our input
  while(current < input.length) {
    var char = input[current];

    /* From here on, we just compare our current character against all the characters
      thet we accept. If there is a match we add 1 to our current variable, push our
      character as a token to our tokens[] array and continue our loop */
    if (char === '=') {
      tokens.push({
        type: 'equal',
        value: '='
      });
      current++;
      continue;
    }

    if (char === '*') {
      tokens.push({
        type: 'star',
        value: '*'
      });
      current++;
      continue;
    }

    if (char === '#') {
      tokens.push({
        type: 'hash',
        value: '#'
      });
      current++;
      continue;
    }

    if (char === '!') {
      tokens.push({
        type: 'not',
        value: '!'
      });
      current++;
      continue;
    }


    if (char === '[' || char === ']') {
      tokens.push({
        type: 'bracket',
        value: char
      });
      current++;
      continue;
    }

    if (char === '-') {
      tokens.push({
        type: 'minus',
        value: '-'
      });
      current++;
      continue;
    }

    if (char === '+') {
      tokens.push({
        type: 'plus',
        value: '+'
      });
      current++;
      continue;
    }

    if (char === '/') {
      // 1) one-line comments
      if (input[++current] === '/') {
        while (current < input.length && !NEWLINE.test(input[current])) {
          current++;
        }
      }
      // 2) multilne comments
      else if (input[current] === '*') {
        current++;
        while (current < input.length) {
          if (input[current] === '*' && input[++current] === '/') {
            current++;
            break;
          }
          current++;
        }
      }
      // a single slash
      else {
        tokens.push({
          type: 'forwardslash',
          value: '/'
        });
      }
      continue;
    }


    if (BACKSLASH.test(char)) {
      tokens.push({
        type: 'backslash',
        value: '\\'
      });
      current++;
      continue;
    }

    if (char === '?') {
      tokens.push({
        type: 'question',
        value: '?'
      });
      current++;
      continue;
    }

    if (char === '<') {
      tokens.push({
        type: 'less',
        value: '<'
      });
      current++;
      continue;
    }

    if (char === '>') {
      tokens.push({
        type: 'greater',
        value: '>'
      });
      current++;
      continue;
    }

    if (char === '|') {
        tokens.push({
          type: 'pipe',
          value: '|'
        });
        current++;
        continue;
    }

    if (char === '&') {
      tokens.push({
        type: 'and',
        value: '&'
      });
      current++;
      continue;
    }

    if (char === '%') {
      tokens.push({
        type: 'percent',
        value: '%'
      });
      current++;
      continue;
    }

    if (char === '$') {
      tokens.push({
        type: 'dollar',
        value: '$'
      });
      current++;
      continue;
    }

    if (char === '@') {
      tokens.push({
        type: 'at',
        value: '@'
      });
      current++;
      continue;
    }

    if (char === '^') {
      tokens.push({
        type: 'caret',
        value: '^'
      });
      current++;
      continue;
    }

    if (char === '~') {
      tokens.push({
        type: 'tilde',
        value: '~'
      });
      current++;
      continue;
    }

    if (char === '`') {
      tokens.push({
        type: 'grave',
        value: '`'
      });
      current++;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({
        type: 'paren',
        value: char
      });
      current++;
      continue;
    }

    if (char === ':') {
      tokens.push({
        type: 'colon',
        value: ':'
      });
      current++;
      continue;
    }

    if (char === '.') {
      tokens.push({
        type: 'dot',
        value: '.'
      });
      current++;
      continue;
    }

    if(char === ',') {
      tokens.push({
        type: 'comma',
        value: ','
      });
      current++;
      continue;
    }

    if (char === ';') {
      tokens.push({
        type: 'semi',
        value: ';'
      });
      current++;
      continue;
    }

    if (char === '{' || char === '}') {
      tokens.push({
        type: 'curly',
        value: char
      });
      current++;
      continue;
    }

    if(WHITESPACE.test(char) || NEWLINE.test(char)) {
      current++;
      continue;
    }

    /* If the character is a number, we need to check if the next character is also a number
    in order to push them altogether as 1 number. i.e. if there is 762, we push "762" not "7","6","2" */
    if(NUMBERS.test(char)) {
      var value = '';

      while(NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({
        type: 'number',
        value: value
      });
      continue;
    }

    /* while checking for LETTERS, we also check for NUMBERS and UNDERLINE
    (i.e. imagine the input as s0m3_c00l_n4m3) or __my_joke_salary */
    if(LETTERS.test(char) || char === '_') {
      var value = char;
      /* need to account for potential end-of-file :D */
      if (++current < input.length) {
        char = input[current];
        /* also need to remember to take care of the last character in the buffer */
        while((LETTERS.test(char) || NUMBERS.test(char) || char === '_') && (current+1 <= input.length)) {
          value += char;
          char = input[++current];
        }
      }
      tokens.push({
        type: 'name',
        value: value
      });
      continue;
    }

    /* if the character is a sigle quote or a double quote, we will treat it as a string.
    Until we haven't found the next double quote or single quote, we continue looping.
    When found, then we push the whole value as a string. */
    if(char === '\'') {
      var value = '';
      char = input[++current];

      while(char !== '\''){
        value += char;
        char = input[++current];
      }
      char = input[++current];
      tokens.push({
        type: 'string',
        value: value
      });
      continue;
    }

    if(char === '"') {
      var value = '';
      char = input[++current];

      while(char !== '"'){
        value += char;
        char = input[++current];
      }
      char = input[++current];
      tokens.push({
        type: 'string',
        value: value
      });
      continue;
    }

      /*whatever else, we don't know jack! */
    throw new TypeError('Type Error! Unrecognized Character: ' + char);
  }
  return tokens;
}
