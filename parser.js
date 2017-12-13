function parser(tokens) {

  var current = 0;

  function walk() {
    var token = tokens[current];

    if (token.type === 'equal') {
      if (tokens[++current].type == 'equal') {
        ++current;
        return {
          type: 'ComparisonE',
          value: token.value + token.value
        };
      } else {
        return {
          type: 'Equal',
          value: token.value
        };
      }
    }

    if (token.type === 'star') {
      current++;
      return {
        type: 'Pointer',
        value: token.value
      };
    }

    if (token.type === 'hash') {
      current++;
      return {
        type: 'Include',
        value: token.value
      };
    }

    if (token.type === 'not') {
        if (tokens[++current].type === 'equal') {
            ++current;
            return {
              type: 'ComaprisonN',
              value: token.value + "="
            };
        } else {
          return {
            type: 'Not',
            value: token.value
          };
        }
    }

    if (token.type === 'plus') {
        if (tokens[++current].type === 'equal') {
            ++current;
            return {
              type: 'IncByNum',
              value: "+="
            };
        } else if (tokens[current].type === 'plus') {
          ++current;
          return {
            type: 'IncByOne',
            value: "++"
          };
        } else {
          return {
            type: 'Plus',
            value: "+"
          };
        }
    }

    if (token.type === 'minus') {
      if(tokens[++current].type === 'minus') {
      current++;
        return {
          type: 'DecByOne',
          value: "--"
        };
      } else if (tokens[current].type === 'equal') {
        current++;
        return {
          type: 'DecByNum',
          value: "-="
        };
      } else if (tokens[current].type === 'greater') {
        current++;
        return {
          type: 'Arrow',
          value: "->"
        };
      } else {
        return {
          type: 'Minus',
          value: token.value
        };
      }
    }

    if (token.value === 'underline') {
      current++;
      return {
        type: 'Underline',
        value: token.value
      };
    }

    if (token.value === 'plus') {
      current++;
      return {
        type: 'Plus',
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

    if (token.type === 'bracket' &&
        token.value === '['
    ) {
      token = tokens[++current];

      var node = {
        type: 'Arr',
        params: []
      };

      while (
        (token.type !== 'bracket') ||
        (token.type === 'bracket' && token.value !== ']')
      ) {

        node.params.push(walk());
        token = tokens[current];
      }
      current++;
      return node;
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
