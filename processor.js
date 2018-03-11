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
  // Here we try to prerpocess out globalStatements to reorder our macro structure
  // This step is beutifies the macro structure in the final AST which means
  // easier to compile in the next step
  globalStatements = preprocessor(globalStatements);
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

// This fucntion will get asBody and return global stuff like global variables, structs
// (and includes which is not yet added)
function findGlobalStatements(astBody) {

  // first we Clone the astBody to be able to fuck it up :D (Nah, seriously!)
  var astBodyClone = astBody;

  // We start by looping through our astBody and look for Terminator ( ; character)
  var current = 0;
  var globalStatements = [];

  while (current < astBodyClone.length) {
    //checking for macros
    if (astBodyClone[0].type === 'Macro') {
      var statement = [];
      if (astBodyClone[1].value === 'include') {
        var macro = [];
        var macroCounter = 0;
        if (astBodyClone[2].type === 'StringLiteral') {
          macro.push(astBodyClone[0]);
          macro.push(astBodyClone[1]);
          macro.push(astBodyClone[2]);
          for (var i = 0; i < 3; i++) {
            astBodyClone.shift();
          }
        } else {
          while ( astBodyClone[macroCounter].type !== 'Greater') {
            macro.push(astBodyClone[macroCounter]);
            macroCounter++;
          }
          macro.push(astBodyClone[macroCounter]);
          for (var i = 0; i < macroCounter + 1; i++) {
            astBodyClone.shift();
          }
        }
        globalStatements.push({
          type: 'Macro',
          value: macro
        });
        current = 0;
      }
    }
    //If we find a terminator (ehem)
    if (astBodyClone[current].type === 'Terminator') {

      // we create a new array holding our statement
      var statement = [];

      for (var i = 0; i < current + 1; i++) {

        // if the first node is a 'struct', we treat it differently
        if (astBodyClone[i].value === 'struct') {

          // in case of an struct, we try to process its body recursively.
          var instruct = processBody(astBodyClone[i+2].expression.arguments);

          // then we push it in our globalStatements array
          globalStatements.push({
            type: 'struct',
            name: astBodyClone[current+1].value,
            body: instruct
          });
          i += 4;
        } else {

          // if not, we treat it like a normal statement, pushing each node into our
          // temporary statement array
          statement.push(astBodyClone[i]);
        }
      }

      // Then we delete the nodes we already went through
      for (var i = 0; i < current + 1; i++) {
        astBodyClone.shift();
      }

      // and push the found statement into globalStatements array
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

  //in the end, we return our globalStatements
  return globalStatements;
}

// this function re-finds our functions and reorganizes them
function findFuncs(astBody) {
  // found array will hold our found functions
  var found = [];

  // looping...
  for (var i = 0; i < astBody.length; i++) {

    //if the current node type is a function..
    if (astBody[i].type === 'Function') {

      // here we check if the node has a property of 'callee'
      // because a codeCave node can also be just some parenthesis for other purposes
      if (astBody[i].expression.hasOwnProperty('callee')) {

        // Then we do furthur varification and sanity checks to make sure this is a function definition
        if(astBody[i].expression.callee.type ==='Identifier') {
          if (astBody[i-1].type === 'Word' && astBody[i-2].type === 'Word') {
            if (astBody[i+1].type === 'Function'){
              if (astBody[i+1].expression.type === 'CodeDomain') {

                // If the current function is 'main'
                if (astBody[i].expression.callee.name ==='main') {

                  // we push it to found[] array but we'll name its type EntryPoint
                  found.push({
                    type: 'EntryPoint',
                    name: astBody[i].expression.callee.name,
                    returnType: astBody[i-2].value,
                    args: astBody[i].expression.arguments,
                    body: astBody[i+1].expression.arguments
                  });
                }

                // if not, we name its type 'FunctionDefinition'
                else {
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

  // In the end we return found[] array which holds our fucntions
  return found;
}

// This function processes the body of every codeDomain and it's the code of our processing stage
function processBody(inside) {
  // this variable holds our statements.
  // the name statements is not literal. It will group and hold whatever is inside a CodeDoamin
  var statements = [];

  // current variable is used to loop through the body
  var current = 0;

  var start = 0;

  while (current < inside.length) {
    var part = inside[current];

    // If the current node is a CodeCave (paranthesis) and after it there is a terminator (;)
    // and before it there is a word then this is a fucntion call.
    if (part.type === 'CodeCave' && inside[current + 1].type === 'Terminator' && inside[current - 1].type === 'Word') {
      // We push our function call inot our statement
      statements.push({
        type: 'Call',
        params: part.arguments,
        callee: part.callee.name
      });
      current++;
      continue;
    }
    // the rest of the code is self-explanatory...
    // next we look for () followd by {} which may be if, for, while,...
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
    }

    // here we check for structs...
    else if (part.type === 'CodeDomain' && inside[current - 1].type === 'Word' && inside[current - 2].value === 'struct') {
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
          // since structs can have bunch of words right after their declaration
          // we loop until we find the terminator
          if (inside[start].value === 'struct') {
            while (inside[start].type !== 'Terminator') {
              start++;
            }
            if (inside[start].type === 'Terminator') {
              start++;
              break;
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


function preprocessor(GlobalStatements) {
  var current = 0;
  while (current < GlobalStatements.length) {
    if (GlobalStatements[current].type === 'Macro') {
      var macro = GlobalStatements[current].value;
      if (macro[1].type === 'Word') {
        if (macro[1].value === 'include') {
          var counter = 0;
          var includedFile = "";
          while (counter < macro.length) {
            if (macro[counter].type === 'Less') {
              counter++;
              while (counter < macro.length && macro[counter].type !== 'Greater') {
                includedFile += macro[counter].value;
                counter++;
              }
            }
            if (macro[counter].type === 'StringLiteral') {
              includedFile += macro[counter].value;
            }
            counter++;
          }
          GlobalStatements[current] = {
            type: 'Macro',
            subtype: 'include',
            file: includedFile
          }
        }
        if (macro[1].value === 'define') {
          console.log('define macro not yet supported :(');
        }
        if (macro[1].value === 'ifndef') {
          console.log('define macro not yet supported :(');
        }
        if (macro[1].value === 'ifdef') {
          console.log('define macro not yet supported :(');
        }
        if (macro[1].value === 'pragma') {
          console.log('pragma macro not yet supported :(');
        }
      }
    }
    current++;
  }
  return GlobalStatements;
}
