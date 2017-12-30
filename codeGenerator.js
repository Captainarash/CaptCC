var stack = [];
var allFuncs = [];
var volatileRegs = ['rcx','rdx','r8','r9'];
var strLiteralSection = '';
var currentFunc = '';

function initGenerate(TheBigAST) {
  var globalItems = TheBigAST[0];
  var functionBox = TheBigAST[1];
  allFuncs = findAllFuncs(functionBox[0].body);
  strLiteralSection = generateStrLiteralSection();
  var funcsAsm = findFunctionNames(functionBox[0].body);
  var dataSection = generateDataSection(globalItems);
  var textHeader = generateTextHeader(TheBigAST[1]);
  var compiled = '';
  if (strLiteralSection.length === 44) {
    compiled = textHeader + funcsAsm + dataSection;
  } else {
    compiled = textHeader + funcsAsm + dataSection + strLiteralSection;
  }
  console.log(compiled);
  return 0;
}

function findAllFuncs(funcDefs) {
  var current = 0;
  allFuncs = [];
  while (current < funcDefs.length) {
    allFuncs.push(funcDefs[current].name);
    current++;
  }
  return allFuncs;
}

function generateFunctionAssembly(functionBody, functionArgs) {
  var current = 0;
  var functionAssembly = "";
  var ifParts = [];
  if (functionBody.length !== 1 || functionArgs.length !== 0) {
    functionAssembly += initStack();
  }
  if (functionArgs.length !== 0) {
    var regIndex = 0
    for (var i = 0; i < functionArgs.length; i++) {
      if (functionArgs[i].type === 'int') {
        functionAssembly += '\tpush ' + volatileRegs[regIndex] + '\n';
        stack.push({
          type: 'LocalVariable',
          name: functionArgs[i].name,
          value: volatileRegs[regIndex]
        });
        regIndex++;
      }
    }
  }
  while (current < functionBody.length) {
    var part = functionBody[current];
    if (current !== 0 && current === (functionBody.length - 1)) {
      functionAssembly += clearStack();
      functionAssembly += restoreRBP();
    }
    if (part.type === 'Statement') {
        var partValue = part.value;
        functionAssembly += checkForStatements(partValue);
    } else if (part.type === 'if') {
      functionAssembly += checkForIfs(part);
    } else if (part.type === 'Call') {
      functionAssembly += generateCall(part);
    }
    current++;
  }
  return functionAssembly;
}

function generateStrLiteralSection() {
  var strLiteralSection = '\t.section\t__TEXT,__cstring,cstring_literals\n';
  return strLiteralSection;
}

function initStack() {
  var prologue = '\tpush rbp\n';
  prologue += '\tmov rbp,rsp\n';
  saveRBP();
  return prologue;
}

function saveRBP() {
  stack.push({
    type: 'SavedRBP',
    value: 'rbp'
  });
}

function restoreRBP() {
  var epilogue = '\tpop rbp\n';
  stack.pop();
  stack.pop();
  return epilogue;
}

function findFunctionNames(functionPack) {
  var funcsAsm = '';
  for (var i = 0; i < functionPack.length; i++) {
    currentFunc = functionPack[i].name;
    funcsAsm += '\t.globl	_' + functionPack[i].name +'\n\n';
    funcsAsm += '_' + functionPack[i].name + ':\n';
    funcsAsm += generateFunctionAssembly(functionPack[i].body, functionPack[i].args);
  }
  return funcsAsm;
}

function generateTextHeader() {
  var header = '\t.section\t__TEXT,__text,regular,pure_instructions\n';
  return header;
}
function generateDataSection(globalItems) {
  var globalVariables = findGlobalVariables(globalItems);
  var dataHeader = generateDataHeader();
  var dataBody = generateDataBody(globalVariables);
  var dataSection = dataHeader + dataBody;
  return dataSection;
}

function generateDataHeader() {
    var header = '\t.section\t__DATA,__data\n';
    return header;
}
function generateDataBody(globalVariables) {
  var dataSection = '';
  for (var i = 0; i < globalVariables.length; i++) {
    dataSection += '\t.globl\t_' + globalVariables[i].name + '\n';
    dataSection += '_' + globalVariables[i].name + ':\n';
    if (globalVariables[i].type === 'int') {
      dataSection += '\t.long\t' + globalVariables[i].value + '\n\n';
    }
  }
  return dataSection;
}
function findGlobalVariables(globalItems) {
  var globalVariables = [];
  var current = 0;
  while (current < globalItems.length) {
      if (globalItems[current].type === 'GlobalStatements') {
        break;
      }
      current++;
  }
  var globalStatementsBody = globalItems[current].body;
  for (var i = 0; i < globalStatementsBody.length; i++) {
    if (globalStatementsBody[i].type === 'Statement') {
      var current = 0;
      var parts = globalStatementsBody[i].value;
      while (current < parts.length - 1) {
        if (parts[current].type === 'Word' && keywords.indexOf(parts[current].value) === -1 && parts[current + 1].type === 'Equal') {
          globalVariables.push ({
            type: parts[current - 1].value,
            name: parts[current].value,
            value: parts[current + 2].value
          });
        }
        current++;
      }
    }
  }
  return globalVariables;
}

function reverseOffset(offset) {
  var reverseOffset = Math.abs(((stack.length -1) - offset));
  return reverseOffset;
}

function generateReturn(returnValue) {
  var retAsm = '';
    if (returnValue.type === 'NumberLiteral') {
        if (returnValue.value === '0') {
          retAsm += '\txor rax,rax\n';
        } else {
          retAsm += '\tmov rax,' + returnValue.value + '\n';
        }
        retAsm += '\tret\n\n';
    }
    return retAsm;
}

function clearStack() {
  var counter = 0;
  for (var i = 0; i < stack.length; i++) {
    if (stack[i].type === 'LocalVariable') {
      counter++;
    }
  }
  var stackClearanceAsm = '\tadd rsp,' + (counter * 8).toString() + '\n';
  while (counter !== 0) {
    stack.pop();
    counter--;
  }
  return stackClearanceAsm;
}

function generateIncByOne(offset){
    var incAssembly = '';
    if (offset === 0) {
      incAssembly = '\tinc DWORD PTR [rsp]\n';
    } else {
      incAssembly = '\tinc DWORD PTR +' + (offset * 8).toString() + '[rsp]\n';
    }
    return incAssembly;
}

function generateIfClause(offset, cmpValue, name) {
  var ifClause = '';
  if (offset === 0) {
    ifClause += '\tcmp DWORD PTR [rsp],' + cmpValue  + '\n';
  } else {
    ifClause += '\tcmp DWORD PTR +' + ((parseInt(offset))*8).toString() + '[rsp],' + cmpValue  + '\n';
  }
  ifClause += '\tjne _if' + name + cmpValue + '_after\n';
  return ifClause;
}

function generateIfInside(ifInside, ifName, ifCmpValue) {
  var current = 0;
  var assembledifInside = '';
  var stacklen = stack.length;
  while (current < ifInside.length) {
    var part = ifInside[current];
    if (part.type === 'Statement') {
      var partValue = part.value;
      assembledifInside += checkForStatements(partValue);
    }
    current++;
  }
  if (stacklen < stack.length) {
    var counter = 0;
    while (stacklen < stack.length) {
      stack.pop();
      counter++;
      stacklen++;
    }
    assembledifInside += '\tadd rsp,' + (counter * 8).toString() + '\n';
  }
  assembledifInside += '\n';
  return assembledifInside;
}

function checkForStatements(part) {
  var functionAssembly = '';
  if (part[0].type === 'Word' && keywords.indexOf(part[0].value) !== -1) {
    if (part[0].value === 'return') {
      functionAssembly += generateReturn(part[1]);
    }

    if (part[0].value === 'int') {
        if (part.length === 5) {
          functionAssembly += generateVariableAssignment(part[0].value, part[1].value, part[3]);
        } else if (part.length > 5) {
          functionAssembly += generateVariableAssignmentWithAddition(part);
        }
    }

    if (part[0].value === 'char') {
      if (part.length === 6) {
        generateStringVariable(part);
      }
    }
  } else if (part[0].type === 'Word' && keywords.indexOf(part[0].value) === -1) {
      for (var i = 0; i < stack.length; i++) {
        if (stack[i].type === 'LocalVariable') {
          if (stack[i].name === part[0].value) {
            if (part[1].type === 'IncByOne') {
              functionAssembly += generateIncByOne(reverseOffset(i));
            }
          }
        }
      }
    }
  return functionAssembly;
}

function checkForIfs(part) {
  var functionAssembly = '';
  if (part.condition.length === 3) {
    var cond = part.condition;
    if (cond[1].type === 'ComparisonE') {
      if (cond[0].type === 'Word' && cond[2].type === 'NumberLiteral') {
        for (var i = 0; i < stack.length; i++) {
          if (stack[i].type === 'LocalVariable' && stack[i].name === cond[0].value) {
            functionAssembly += generateIfClause(reverseOffset(i), cond[2].value, cond[0].value);
            functionAssembly += generateIfInside(part.body, cond[0].value, cond[2].value);
            functionAssembly += '_if' + cond[0].value + cond[2].value + '_after:\n';
          }
        }
      }
    }
  }
  return functionAssembly;
}
function generateCall(part) {
  callAsm = '';
  if (allFuncs.indexOf(part.callee) !== -1) {
    var params = part.params;
    var current = 0;
    var regIndex = 0;
    while (current < params.length) {
      if (params[current].type === 'Delimiter') {
        current++;
        continue;
      } else if (params[current].type === 'NumberLiteral') {
        callAsm += '\tmov ' + volatileRegs[regIndex] + ',' + params[current].value + '\n';
        regIndex++;
        current++;
        continue;
      }
      current++;
    }
    callAsm += '\tcall ' + part.callee + '\n';
  }
  return callAsm;
}

function generateStringVariable(part) {
  if (part[1].type === 'Word' && part[2].type === 'Arr') {
    for (var i = 0; i < stack.length; i++) {
      if (stack[i].type === 'LocalVariable') {
        if (stack[i].name === part[1].value) {
          throw new TypeError('Varibale already defined: ' + part[1].value);
        }
      }
    }
    var theCharArray = part[2].value
    if (theCharArray.length === 0) {
      if (part[4].type === 'StringLiteral') {
        strLiteralSection += '\nL_' + currentFunc + '_' + part[1].value + ':\n';
        strLiteralSection += '\t.ascii\t\"' + escapeThis(part[4].value) + '\"\n';
      }
    }
  }
}

function escapeThis(strLiteral) {
  var escaped = '';
  escaped = strLiteral.replace(/\n/g, '\\n');
  escaped = escaped.replace(/\r/g, '\\r');
  escaped = escaped.replace(/\t/g, '\\t');
  return escaped;
}

function generateVariableAssignment(varType, varName, varValue) {
  assignmentAsm = '';
  if (varValue.type === 'NumberLiteral') {
    if (varType === 'int') {
      assignmentAsm += '\tpush ' + varValue.value + '\n';
      stack.push({
        type: 'LocalVariable',
        name: varName,
        value: varValue.value
      });
    }
  } else if (varValue.type === 'Word') {
    if (varType === 'int') {
      for (var i = 0; i < stack.length; i++) {
        if (stack[i].type === 'LocalVariable') {
          if (stack[i].name === varValue.value) {
            if (i !== stack.length) {
              assignmentAsm += '\tmov rax,+' + (reverseOffset(i) * 8).toString() + '[rsp]\n';
            } else {
              assignmentAsm += '\tmov rax,[rsp]\n';
            }
            assignmentAsm += '\tpush rax\n';
            stack.push({
              type: 'LocalVariable',
              name: varName,
              value: stack[i].value
            });
          }
        }
      }
    }
  }
  return assignmentAsm;
}

function generateVariableAssignmentWithAddition(statement) {
  var current = 0;
  var counter = 0;
  var sum = 0;
  var statementAssembly = '';
  statementAssembly = '\txor rax,rax\n';
  while (current < statement.length) {
    if (statement[current].type === 'Equal') {
      var varName = statement[current - 1].value;
      var pmCounter = 0 ;
      if (statement[current + 1].type === 'Minus') {
        pmCounter = current + 3;
      } else {
        pmCounter = current + 2;
      }
      while (statement[pmCounter].type === 'Plus' || statement[pmCounter].type === 'Minus') {
        if (statement[pmCounter - 1].type === 'NumberLiteral' && statement[pmCounter + 1].type === 'NumberLiteral') {
          if (counter === 0) {
            if (statement[current + 1].type === 'Minus') {
              sum -= parseInt(statement[pmCounter - 1].value);
              statementAssembly += '\tsub rax,' + statement[pmCounter - 1].value + '\n';
            } else {
              sum += parseInt(statement[pmCounter - 1].value);
              statementAssembly += '\tadd rax,' + statement[pmCounter - 1].value + '\n';
            }
          }
          if (statement[pmCounter].type === 'Plus') {
            sum += parseInt(statement[current + 1].value);
            statementAssembly += '\tadd rax,' + statement[pmCounter + 1].value + '\n';
          } else if (statement[pmCounter].type === 'Minus') {
            sum -= parseInt(statement[current + 1].value);
            statementAssembly += '\tsub rax,' + statement[pmCounter + 1].value + '\n';
          }
          counter++;
        }
        pmCounter += 2;
      }
    }
    current++;
  }
  if (counter !== 0) {
    statementAssembly += '\tpush rax\n';
    stack.push({
      type: 'LocalVariable',
      name: statement[1].value,
      value: sum
    });
    return statementAssembly;
  }
  return 'Error!';
}
