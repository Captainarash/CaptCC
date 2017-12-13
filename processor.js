var foundFuncs = [];
function processor(ast) {
  var astBody = ast.body;
  var mainFunc = findEntry(astBody);
  foundFuncs = findFuncs(astBody);
  console.log(foundFuncs);
  return mainFunc;
}

function findEntry(astBody) {
  for (var i = 0; i < astBody.length; i++) {
    if (astBody[i].type === 'Function') {
        if (astBody[i].expression.hasOwnProperty('callee')) {
          if(astBody[i].expression.callee.name === 'main'
          && astBody[i-1].type === 'Word' && astBody[i-2].type === 'Word'
          )   {
            if (astBody[i+1].type === 'Function'){
              if (astBody[i+1].expression.type === 'CodeDomain') {
                return {
                  type: 'EntryPoint',
                  name: 'main',
                  returnType: astBody[i-2].value,
                  args: astBody[i].expression.arguments,
                  body: astBody[i+1].expression.arguments
                };
              }
            }
          }
        }
      }
    }
  }

function findFuncs(astBody) {
  var found = [];
  for (var i = 0; i < astBody.length; i++) {
    if (astBody[i].type === 'Function') {
      if (astBody[i].expression.hasOwnProperty('callee')) {
        if(astBody[i].expression.callee.type ==='Identifier') {
          if (astBody[i-1].type === 'Word' && astBody[i-2].type === 'Word') {
            if (astBody[i+1].type === 'Function'){
              if (astBody[i+1].expression.type === 'CodeDomain') {
                found.push({
                  type: 'FunctionDefinition',
                  name: astBody[i].expression.callee.name,
                  returnType: astBody[i-2].value,
                  args: astBody[i].expression.arguments,
                  body: astBody[i+1].expression.arguments
                });
              }
            }
          }
        }
      }
    }
  }
  return found;
}
