function tokenizer(input) {
  var current = 0;
  var tokens = [];
  while(current < input.length) {
    var char = input[current];
    if (char.match(/(^|[^!><'=])=($|[^=])/) != null) {
      tokens.push({
        type: 'equal',
        value: '='
      });
      current++;
      continue;
    }
    if (char === '(') {
      tokens.push({
        type: 'paren',
        value: '('
      });
      current++;
      continue;
    }

    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')'
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

    if (char === '{') {
      tokens.push({
        type: 'curly',
        value: '{'
      });
      current++;
      continue;
    }

    if (char === '}') {
      tokens.push({
        type: 'curly',
        value: '}'
      });
      current++;
      continue;
    }

    var WHITESPACE = /\s/;
    if(WHITESPACE.test(char)) {
      current++;
      continue;
    }

    var NEWLINE = /\n/;
    if(NEWLINE.test(char)) {
      current++;
      continue;
    }

    var NUMBERS = /[0-9]/;
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

    var LETTERS = /[a-zA-Z]/;
    if(LETTERS.test(char)) {
      var value = '';

      while(LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({
        type: 'name',
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

    throw new TypeError('I don\'t know this character: ' + char);
  }
  return tokens;
}
