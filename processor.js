function processor(ast) {
  var astBody = ast.body;
  var foundFuncs = findFuncs(astBody);
  for (var i = 0; i < foundFuncs.length; i++) {
    var newBody = processBody(foundFuncs[i].body);
    foundFuncs[i].body = newBody;
  }
  return foundFuncs;
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
                if (astBody[i].expression.callee.name ==='main') {
                  found.push({
                    type: 'EntryPoint',
                    name: astBody[i].expression.callee.name,
                    returnType: astBody[i-2].value,
                    args: astBody[i].expression.arguments,
                    body: astBody[i+1].expression.arguments
                  });
                } else {
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
  }
  return found;
}

function processBody(inside) {
  var statements = [];
  var current = 0;
  var start = 0;
  var tokens = [];
  while (current < inside.length) {
    var part = inside[current];
    if (part.type === 'CodeDomain' && inside[current - 1].type === 'CodeCave') {
      if (inside[current - 2].type === 'Word') {
        if (inside[current - 2].value === 'if') {
          if((current - 3) >= 0){
            if (inside[current - 3].type === 'Word') {
              if (inside[current - 3].value === 'else') {
                var inelseif = processBody(part.arguments);
                statements.push({
                  type: 'elseif',
                  condition: inside[current - 1].arguments,
                  body: inif
                });
                current++;
                continue;
              }
            } else {
              var inif = processBody(part.arguments);
              statements.push({
                type: 'if',
                condition: inside[current - 1].arguments,
                body: inif
              });
              current++;
              continue;
            }
          } else {
            var inif = processBody(part.arguments);
            statements.push({
              type: 'if',
              condition: inside[current - 1].arguments,
              body: inif
            });
            current++;
            continue;
          }
        } else if (inside[current - 2].value === 'while') {
          var inwhile = processBody(part.arguments);
          statements.push({
            type: 'while',
            condition: inside[current - 1].arguments,
            body: inwhile
          });
          current++;
          continue;
        } else if (inside[current - 2].value === 'for') {
          var infor = processBody(part.arguments);
          statements.push({
            type: 'for',
            condition: inside[current - 1].arguments,
            body: infor
          });
          current++;
          continue;
        } else if (inside[current - 2].value === 'switch') {
          // first we find the colons
          var count = 0;
          var cases = [];
          var args = inside[current].arguments;
          args.reverse();
          console.log(args);
          var reverseCaseParts = [];
          while (count < args.length) {
            if (args[count].type !== 'Colon') {
                reverseCaseParts.push(args[count]);
            } else {
              var currentCaseType = args[count+1].type;
              var currentCaseValue = args[count+1].value;
              var currentStatementsGroup = reverseCaseParts.reverse();
              if (args[count+1].value === 'default') {
                count++;
              } else if (args[count+2].value === 'case') {
                count += 2;
              }
              reverseCaseParts = [];
              var caseStatements = processBody(currentStatementsGroup);
              cases.push({
                caseType: currentCaseType,
                caseValue: currentCaseValue,
                caseStatements: caseStatements
              });
            }
            count++;
          }
          statements.push({
            type: 'switch',
            condition: inside[current - 1].arguments,
            body: cases
          });
          current++;
          continue;
        }
      } else {
        throw new SyntaxError('Invalid Syntax!');
      }
    } else if (part.type === 'CodeDomain' && inside[current - 1].value === 'else') {
      var inelse = processBody(part.arguments);
      statements.push({
        type: 'else',
        body: inelse
      });
      current++;
      continue;
    } else if (part.type === 'CodeDomain' && inside[current - 1].value === 'do') {
      if (inside[current + 1].type === 'Word' && inside[current + 1].value === 'while') {
        if (inside[current + 2].type === 'CodeCave') {
          var indo = processBody(part.arguments);
          statements.push({
            type: 'do',
            condition: inside[current + 2].arguments,
            body: indo
          });
          current++;
          continue;
        }
      } else {
        throw new SyntaxError('Invalid Syntax!');
      }
    }


    if (part.type === 'Terminator') {
      var phrase = [];
      if (inside[current-1].type === 'CodeCave' && inside[current-2].value === 'while') {
        current++;
        continue
      }
      while (start <= current) {
        if (inside[start].type === 'Word') {
          if (inside[start].value === 'if' || inside[start].value === 'for' || inside[start].value === 'switch' || inside[start].value === 'while') {
            start += 3;
            continue;
          }
          if (inside[start].value === 'do') {
            start += 5;
            continue;
          }
          if (inside[start].value === 'else' && inside[start+1].type === 'CodeDomain') {
            start += 2;
            continue;
          }
        }
        phrase.push({
          type: inside[start].type,
          value: inside[start].value
        });
        start++;
      }
      statements.push(phrase);
    }
    current++;
    continue;
  }
  return statements;
}
