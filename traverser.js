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

      case 'Arr':
      case 'NumberLiteral':
      case 'StringLiteral':
      case 'Word':
      case 'Delimiter':
      case 'Terminator':
      case 'Equal':
      case 'Pointer':
      case 'IncByOne':
      case 'DecByOne':
      case 'Arrow':
      case 'Plus':
      case 'Minus':
      case 'IncByNum':
      case 'DecByNum':
      case 'ComparisonE':
      case 'ComparisonN':
      case 'Include':
      case 'Not':
      case 'Colon':
      case 'Less':
      case 'Greater':
      case 'LessOrEqual':
      case 'GreaterOrEqual':
      case 'Dot':
      case 'XorEqual':
      case 'OrOr':
      case 'Pipe':
      case 'AndAnd':
      case 'And':
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

    IncByOne: {
      enter(node, parent) {
        parent._context.push({
          type: 'IncByOne',
          value: node.value
        });
      },
    },

    DecByOne: {
      enter(node, parent) {
        parent._context.push({
          type: 'DecByOne',
          value: node.value
        });
      },
    },

    DecByOne: {
      enter(node, parent) {
        parent._context.push({
          type: 'Arrow',
          value: node.value
        });
      },
    },

    Plus: {
      enter(node, parent) {
        parent._context.push({
          type: 'Plus',
          value: node.value
        });
      },
    },

    Minus: {
      enter(node, parent) {
        parent._context.push({
          type: 'Minus',
          value: node.value
        });
      },
    },

    IncByNum: {
      enter(node, parent) {
        parent._context.push({
          type: 'IncByNum',
          value: node.value
        });
      },
    },

    DecByNum: {
      enter(node, parent) {
        parent._context.push({
          type: 'DecByNum',
          value: node.value
        });
      },
    },

    ComparisonE: {
      enter(node, parent) {
        parent._context.push({
          type: 'ComparisonE',
          value: node.value
        });
      },
    },

    ComparisonN: {
      enter(node, parent) {
        parent._context.push({
          type: 'ComparisonN',
          value: node.value
        });
      },
    },

    Include: {
      enter(node, parent) {
        parent._context.push({
          type: 'Include',
          value: node.value
        });
      },
    },

    Not: {
      enter(node, parent) {
        parent._context.push({
          type: 'Not',
          value: node.value
        });
      },
    },

    Colon: {
      enter(node, parent) {
        parent._context.push({
          type: 'Colon',
          value: node.value
        });
      },
    },

    Colon: {
      enter(node, parent) {
        parent._context.push({
          type: 'Dot',
          value: node.value
        });
      },
    },

    Less: {
      enter(node, parent) {
        parent._context.push({
          type: 'Less',
          value: node.value
        });
      },
    },

    Greater: {
      enter(node, parent) {
        parent._context.push({
          type: 'Greater',
          value: node.value
        });
      },
    },

    GreaterOrEqual: {
      enter(node, parent) {
        parent._context.push({
          type: 'GreaterOrEqual',
          value: node.value
        });
      },
    },

    LessOrEqual: {
      enter(node, parent) {
        parent._context.push({
          type: 'LessOrEqual',
          value: node.value
        });
      },
    },

    XorEqual: {
      enter(node, parent) {
        parent._context.push({
          type: 'XorEqual',
          value: node.value
        });
      },
    },

    Arr: {
      enter(node, parent) {
        parent._context.push({
          type: 'Arr',
          value: node.params
        });
      },
    },

    Pointer: {
      enter(node, parent) {
        parent._context.push({
          type: 'Pointer',
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

    Delimiter: {
      enter(node, parent) {
        parent._context.push({
          type: 'Delimiter',
          value: node.value
        });
      },
    },

    Terminator: {
      enter(node, parent) {
        parent._context.push({
          type: 'Terminator',
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

        if (parent.type === 'Program') {

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
