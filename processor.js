/* After the traversing and transforming the AST to a new AST, we pass the newAST to processor
 to... guess what? Yes! An even bigger and more organized AST! */

function processor(ast) {
  /* first we get our ast body and start finding the global stuff.
  Things like global variables, includes, structs are found here */
  var astBody = ast.body;
  // This variable globalItems will hold all of iur global stuff.
  var globalItems = [];
  // We start by looking for them using findGlobalStatements() function
  var globalStatements = findGlobalStatements(astBody);
  // and we push it into our globalItems array
  globalItems.push({
    type: 'GlobalStatements',
    body: globalStatements
  });

  // Then we define another top level node called fucntionPack.
  // All the found functions will end up here.
  var functionPack = [];

  // We'll start by finding the functions and reorganize them using findFuncs() function
  var foundFuncs = findFuncs(astBody);

  // The we start our real task which is processing the body of each function
  // We loop though each found function and call processBody() fucntion on them.
  for (var i = 0; i < foundFuncs.length; i++) {
    // newBody will hold our organized body of our function
    var newBody = processBody(foundFuncs[i].body);

    // The we'll update our current function.body
    foundFuncs[i].body = newBody;

    //same goes for fucntion arguments :)
    var newFuncArgs = updateFunctionArguments(foundFuncs[i].args);
    foundFuncs[i].args = newFuncArgs;

  }

  // Then we push our found function with their updated bodies abd arguments into our
  // top level functionPack array
  functionPack.push({
    type: 'Functions',
    body: foundFuncs
  });
  // At the end, we'll define our final abstract syntax tree structure and name it TheBigAST:)
  // and push our 2 top level arrays: globalItems and functionPack into it.
  // TheBigAST will then be ready to be compiled
  var TheBigAST = [];
  TheBigAST.push(globalItems,functionPack);

  return TheBigAST;
}

function findGlobalStatements(astBody) {
  var astBodyClone = astBody;
  var current = 0;
  var globalStatements = [];

  while (current < astBodyClone.length) {
    if (astBodyClone[current].type === 'Terminator') {
      var statement = [];
      for (var i = 0; i < current + 1; i++) {
        if (astBodyClone[i].value === 'struct') {
          var instruct = processBody(astBodyClone[i+2].expression.arguments);
          globalStatements.push({
            type: 'struct',
            name: astBodyClone[current+1].value,
            body: instruct
          });
          i += 4;
        } else {
          statement.push(astBodyClone[i]);
        }
      }
      for (var i = 0; i < current + 1; i++) {
        astBodyClone.shift();
      }
      if (statement.length !== 0) {
        globalStatements.push({
          type: 'Statement',
          value: statement
        });
      }
      current = 0;
    }
    current++;
  }
  return globalStatements;
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
    if (part.type === 'CodeCave' && inside[current + 1].type === 'Terminator' && inside[current - 1].type === 'Word') {
      statements.push({
        type: 'Call',
        params: part.arguments,
        callee: part.callee.name
      });
      current++;
      continue;
    }
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
          var count = 0;
          var cases = [];
          var args = inside[current].arguments;
          args.reverse();
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
        throw new TypeError('Invalid Syntax!');
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
        throw new TypeError('Invalid Syntax!');
      }
    } else if (part.type === 'CodeDomain' && inside[current - 1].type === 'Word' && inside[current - 2].value === 'struct') {
      if (inside[current + 1].type === 'Terminator') {
        var instruct = processBody(part.arguments);
        statements.push({
          type: 'struct',
          name: inside[current - 1].value,
          body: instruct
        });
        current++;
        continue;
      }
    }


    if (part.type === 'Terminator') {
      var phrase = [];
      if (inside[current - 1].type === 'CodeCave' && inside[current - 2].value === 'while') {
        current++;
        continue
      }
      if (inside[current - 1].type === 'CodeDomain' && inside[current - 3].value === 'struct') {
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
          if (inside[start].value === 'struct') {
            while (inside[start].type !== 'Terminator') {
              start++;
            }
            if (inside[start].type === 'Terminator') {
              start++;
              continue;
            }
          }
        }
        phrase.push({
          type: inside[start].type,
          value: inside[start].value
        });
        start++;
      }
      statements.push({
          type: 'Statement',
          value: phrase
      });
    }

    if (current === inside.length - 1) {
      if (part.type !== 'Terminator' && part.type !== 'CodeDomain') {
        throw new TypeError('Error in function definition: Function must return something\n or end with a ; \n or if this fucntion doesn\'t return anything\n you screwed up somewhere!');
        break;
      }
    }
    current++;
    continue;
  }
  return statements;
}

function updateFunctionArguments(cave) {
  var current = 0;
  var params = [];
  var last = 0;
  while (current < cave.length) {
    if (cave[current].type === 'Delimiter') {
      if ((current - last) === 2) {
        if (cave[current - 2].type === 'Word' && cave[current - 1].type === 'Word') {
          params.push({
            type: cave[current - 2].value,
            name: cave[current - 1].value
          });
          last += current;
        } else {
          throw new TypeError('Error in function definition: Invalid arguments!');
        }
      }
      current++;
      continue;
    }
    if (current === (cave.length - 1)) {
      if ((current - last) === 2) {
        if (cave[current - 1].type === 'Word' && cave[current].type === 'Word') {
          params.push({
            type: cave[current - 1].value,
            name: cave[current].value
          });
          last += current;
        } else {
          throw new TypeError('Error in function definition: Invalid arguments!');
        }
      }
      current++;
      continue;
    }
    current++;
  }
  return params;
}
