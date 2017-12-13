function traverser(ast, visitor) {


  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  function traverseNode(node, parent) {

    let methods = visitor[node.type];

    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    switch (node.type) {

      case 'Program':
        traverseArray(node.body, node);
        break;

      case 'CodeCave':
        traverseArray(node.params, node);
        break;

      case 'CodeDomain':
        traverseArray(node.params, node);

      case 'NumberLiteral':
      case 'StringLiteral':
      case 'Word':
      case 'Delimiter':
      case 'Terminator':
      case 'Equal':
        break;

      default:
        throw new TypeError(node.type);
    }

    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  traverseNode(ast, null);
}

function transformer(ast) {

  let newAst = {
    type: 'Program',
    body: [],
  };

  ast._context = newAst.body;

  traverser(ast, {
    NumberLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value
        });
      },
    },

    Word: {
      enter(node, parent) {
        parent._context.push({
          type: 'Word',
          value: node.value
        });
      },
    },

    Equal: {
      enter(node, parent) {
        parent._context.push({
          type: 'Equal',
          value: node.value
        });
      },
    },

    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value
        });
      },
    },

    CodeCave: {
      enter(node, parent) {
        if (typeof(node.name) != 'undefined') {
          var expression = {
            type: 'CodeCave',
            callee: {
              type: 'Identifier',
              name: node.name
            },
            arguments: [],
          };
        } else {
          var expression = {
            type: 'CodeCave',
            arguments: [],
          };
        }

        node._context = expression.arguments;

        if (parent.type !== 'CodeCave') {

          expression = {
            type: 'Function',
            expression: expression
          };
        }

        parent._context.push(expression);
      },
    },

    CodeDomain: {
      enter(node, parent) {
        var expression = {
          type: 'CodeDomain',
          arguments: [],
        };

        node._context = expression.arguments;

        if (parent.type !== 'CodeDomain') {
          expression = {
            type: 'Function',
            expression: expression
          };
        }
        parent._context.push(expression);
      },
    }
  });
  return newAst;
}
