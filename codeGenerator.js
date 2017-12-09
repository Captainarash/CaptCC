var output = "";
function codeGenerator(node, parent) {
  parent = parent || node;
  let current = 0;
  if (node.type === 'Program') {
    console.log('[+] Program node');
    output += ".section __TEXT\n";
    var body = node.body;
    while (current < body.length) {
      codeGenerator(body[current],parent);
      current++;
    }
  }
  if (node.type === 'Word') {
    var tick = 0;
    if (parent.type === 'Program') {
      if (node.value === 'int' && parent.body[1].value === 'main') {
        output += "\t.globl _main\n_main:\n"
      }
    }

    if (node.value === 'int' && parent.type === 'CodeDomain') {
      if (parent.arguments[current+1].type === 'Word') {
        output += "\tmov\t$" + parent.arguments[current+3].value + ",%eax\n\tpush\t%eax\n"
      }
    }
    if (node.value === 'return' && parent.type === 'CodeDomain') {
      if (parent.arguments[parent.arguments.length-1].type === 'NumberLiteral') {
        output += "\tmov\t$" + parent.arguments[parent.arguments.length-1].value + ",%eax\n\tret\n";
      }
    }
  }
  if (node.type === 'ExpressionStatement') {
    codeGenerator(node.expression);
  }
  if (node.type === 'CodeCave') {
    console.log('[+] CodeCave node');
    if(node.callee != 'undefined') {
      codeGenerator(node.callee, node);
    }
  }
/**  if (node.type === 'Identifier') {
    console.log('found an Identifier node');
  }*/

  if (node.type === 'CodeDomain') {
    console.log('[+] CodeDomain node');
    let currentArg = 0;
    let args = node.arguments;
    while (currentArg < node.arguments.length) {
      codeGenerator(args[currentArg],node);
      currentArg++;
    }
  }
/**  if (node.type === 'NumberLiteral') {
    console.log('FOUND a NUMBERLITERAL');
  }*/
}
