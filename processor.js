function processor(ast) {
  var astBody = ast.body;
  var mainFunc = findEntry(astBody);
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
