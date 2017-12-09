function parser(tokens) {

  var current = 0;

  function walk() {
    var token = tokens[current];

    if (token.type === 'equal') {
      current++;
      return {
        type: 'Sign',
        value: token.value
      };
    }

    if (token.type === 'name') {
        current++;
        return {
          type: 'Word',
          value: token.value
        };
    }
    if (token.type === 'comma') {
      current++;
      return {
        type: 'Delimiter',
        value: token.value
      };
    }

    if (token.type === 'curly' &&
        token.value === '{'
    ) {
      token = tokens[++current];

      var node = {
        type: 'CodeDomain',
        params: []
      };

      while (
        (token.type !== 'curly') ||
        (token.type === 'curly' && token.value !== '}')
      ) {

        node.params.push(walk());
        token = tokens[current];
      }
      current++;
      return node;
    }

    if (token.type === 'semi') {
      current++;
      return {
        type: 'Terminator',
        value: token.value
      };
    }

    if (token.type === 'number') {
      current++;
      return {
        type: 'NumberLiteral',
        value: token.value
      };
    }

    if (token.type === 'string') {
      current++;
      return {
        type: 'StringLiteral',
        value: token.value
      };
    }

    if (
      token.type === 'paren' &&
      token.value === '('
    ) {
      token = tokens[++current];
      let prevToken = tokens[current - 2];
      if (typeof(prevToken) != 'undefined' && prevToken.type === 'name') {
        var node = {
          type: 'CodeCave',
          name: prevToken.value,
          params: []
        };
      } else {
          var node = {
            type: 'CodeCave',
            params: []
          };
      }

      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        node.params.push(walk());
        token = tokens[current];
      }

      current++;
      return node;
    }

    throw new TypeError(token.type);
  }

  let ast = {
    type: 'Program',
    body: [],
  };

  while (current < tokens.length) {
    ast.body.push(walk());
  }
  
  return ast;
}
