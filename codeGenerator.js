var stack = [];
var allFuncs = [];
var volatileRegs = ['rcx','rdx','r8','r9']; // this is for Win64-FastCall Calling Convention
var strLiteralSection = '';
var currentFunc = '';
// List of additional settings coming in the future:
// setting the mnemonic: AT&T or Intel
// var mnemonic = 'AT&T';
// setting the syntax: GCC-OSX, GCC-Linux, MASM, NASM, etc.
// var syntax = 'GCC-OSX'
// setting the calling convention: Win64-FastCall, Linux-FastCall, CDECL, etc.
// var calling_convention = 'Win64-FastCall';
// setting the mode: 16, 32, 64.
// var mode = 64.

function initGenerate(TheBigAST) {
  var globalItems = TheBigAST[0];
  var functionBox = TheBigAST[1];
  allFuncs = findAllFuncs(functionBox[0].body);
  //strLiteralSection = generateStrLiteralSection();
  var funcsAsm = findFunctionNames(functionBox[0].body);
  var headers = includeHeaders(globalItems);
  var dataSection = generateDataSection(globalItems);
  var textHeader = generateTextHeader(TheBigAST[1]);
  var compiled = textHeader + funcsAsm + dataSection;
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
        functionAssembly += '\tpush %' + volatileRegs[regIndex] + '\n';
        stack.push({
          type: 'LocalVariable',
          name: functionArgs[i].name,
          value: volatileRegs[regIndex],
          variableType: 'int'
        });
        regIndex++;
      }
    }
  }
  while (current < functionBody.length) {
    var part = functionBody[current];
    if (part.type === 'Statement') {
        var partValue = part.value;
        functionAssembly += checkForStatements(partValue);
    } else if (part.type === 'if') {
      functionAssembly += checkForIfs(part);
    } else if (part.type === 'Call') {
      functionAssembly += generateCall(part);
    }

    /** finally, if we are at the end of the block and there is absolutely nothing to parse
    **  we add stack clearing code
    **/
    if (current !== 0 && current === (functionBody.length - 1)) {
      clearStack();
      restoreRBP();
    }
    //clearStack();
    current++;
  }
  // for now we only support the functions that return 1 value.
  // hence, we clear the stack only in the end of a function;
  //clearStack();
  return functionAssembly;
}

function generateStrLiteralSection() {
  var strLiteralSection = '\t.section\t__TEXT,__cstring,cstring_literals\n';
  return strLiteralSection;
}

function initStack() {
  var prologue = '\tpush %rbp\n';
  prologue += '\tmov %rsp,%rbp\n';
  saveRBP();
  return prologue;
}

function saveRBP() {
  stack.push({
    type: 'SavedRBP',
    name: '',
    value: 'rbp',
    variableType: ''
  });
}

function restoreRBP() {
    stack.pop();
}

function addRestoreRBPAsm() {
   return '\tpop %rbp\n';
}

function findFunctionNames(functionPack) {
  var funcsAsm = '';
  for (var i = 0; i < functionPack.length; i++) {
    currentFunc = functionPack[i].name;
    if (functionPack[i].name === 'main') {
      funcsAsm += '\t.globl	main\n\n';
      funcsAsm += 'main:\n';
    } else {
      funcsAsm += '\t.globl	_' + functionPack[i].name +'\n\n';
      funcsAsm += '_' + functionPack[i].name + ':\n';
    }

    funcsAsm += generateFunctionAssembly(functionPack[i].body, functionPack[i].args);
  }
  return funcsAsm;
}

function generateTextHeader() {
  var header = '\t.text\n';
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
    var header = '\t.data\n';
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

function findOnTheStack(value){
  for (var i = 0; i < stack.length; i++) {
    if(stack[i].name === value){
      return i;
    }
  }
  return -1;
}

function generateReturn(returnValue) {
  var retAsm = '';
    if (returnValue.type === 'NumberLiteral') {
        if (returnValue.value === '0') {
          retAsm += '\txor %rax,%rax\n';
        } else {
          retAsm += '\tmov $' + returnValue.value + ',%rax\n';
        }
    }
    else if (returnValue.type === 'Word') {
      if (!isAKeyword(returnValue.value)) {
        stackEntry = findOnTheStack(returnValue.value);
        if (stackEntry !== -1) {
          stackOffset = reverseOffset(stackEntry);
          switch (stack[stackEntry].variableType) {
            case 'int': {
              if ( stackOffset !== 0) {
                retAsm += '\tmov ' + stackOffset * 8 + '(%rsp), %rax\n';
              }
              else {
                retAsm += '\tmov (%rsp), %rax\n';
              }
              break;
            }
            default:
              break;
          }
        }
      }
    }
    retAsm += addClearStackAsm();
    retAsm += addRestoreRBPAsm();
    retAsm += '\tret\n\n';
    return retAsm;
}

function addClearStackAsm() {
  var counter = 0;
  for (var i = 0; i < stack.length; i++) {
    if (stack[i].type === 'LocalVariable') {
      counter++;
    }
  }
  return '\tadd $' + (counter * 8).toString() + ',%rsp\n';
}

function clearStack() {
  var entries = [];
  for (var i = 0; i < stack.length; i++) {
    if (stack[i].type === 'LocalVariable') {
      entries.push(i);
    }
  }
  while (entries.length !== 0) {
    stack.splice(entries[entries.length - 1], 1);
    entries.pop();
  }
  return;
}

function generateIncByOne(offset){
    var incAssembly = '';
    if (offset === 0) {
      incAssembly = '\tincl (%rsp)\n';
    } else {
      incAssembly = '\tincl ' + (offset * 8).toString() + '(%rsp)\n';
    }
    return incAssembly;
}

function generateIfClause(offset, cmpValue, name) {
  var ifClause = '';
  if (offset === 0) {
    ifClause += '\tcmp $' + cmpValue  + ',(%rsp)\n';
  } else {
    ifClause += '\tcmp $' + cmpValue  + ',' + ((parseInt(offset))*8).toString() + '(%rsp)\n';
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
    assembledifInside += '\tadd $' + (counter * 8).toString() + ',%rsp\n';
  }
  assembledifInside += '\n';
  return assembledifInside;
}

function isAKeyword(word){
  if (keywords.indexOf(word) !== -1) {
    return true;
  }
  return false;
}

function checkForStatements(part) {
  var functionAssembly = '';
  var didaddEpilouge = 0;
  if (part[0].type === 'Word' && isAKeyword(part[0].value)) {
    if (part[0].value === 'return') {
      functionAssembly += generateReturn(part[1]);
      didaddEpilouge = 1;
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
  } else if (part[0].type === 'Word' && !isAKeyword(part[0].value)) {
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
        callAsm += '\tmov $' + params[current].value + ',%' + volatileRegs[regIndex] + '\n';
        regIndex++;
        current++;
        continue;
      }
      current++;
    }
    callAsm += '\tcall _' + part.callee + '\n';
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
      assignmentAsm += '\tpush $' + varValue.value + '\n';
      stack.push({
        type: 'LocalVariable',
        name: varName,
        value: varValue.value,
        variableType: varType
      });
    }
  } else if (varValue.type === 'Word') {
    if (varType === 'int') {
      for (var i = 0; i < stack.length; i++) {
        if (stack[i].type === 'LocalVariable') {
          if (stack[i].name === varValue.value) {
            if (i !== stack.length) {
              assignmentAsm += '\tmov '+ (reverseOffset(i) * 8).toString() + '(%rsp)' + ',%rax\n';
            } else {
              assignmentAsm += '\tmov (%rsp),%rax\n';
            }
            assignmentAsm += '\tpush %rax\n';
            stack.push({
              type: 'LocalVariable',
              name: varName,
              value: stack[i].value,
              variableType: varType
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
  statementAssembly = '\txor %rax,%rax\n';
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
              statementAssembly += '\tsub $' + statement[pmCounter - 1].value + ',%rax\n';
            } else {
              sum += parseInt(statement[pmCounter - 1].value);
              statementAssembly += '\tadd $' + statement[pmCounter - 1].value + ',%rax\n';
            }
          }
          if (statement[pmCounter].type === 'Plus') {
            sum += parseInt(statement[current + 1].value);
            statementAssembly += '\tadd $' + statement[pmCounter + 1].value + ',%rax\n';
          } else if (statement[pmCounter].type === 'Minus') {
            sum -= parseInt(statement[current + 1].value);
            statementAssembly += '\tsub $' + statement[pmCounter + 1].value + ',%rax\n';
          }
          counter++;
        }
        pmCounter += 2;
      }
    }
    current++;
  }
  if (counter !== 0) {
    statementAssembly += '\tpush %rax\n';
    stack.push({
      type: 'LocalVariable',
      name: statement[1].value,
      value: sum,
      variableType: "int"
    });
    return statementAssembly;
  }
  return 'Error!';
}

function includeHeaders(globalItems) {
  var includes = [];
  var current = 0;
  var globalStatements = globalItems[0];
  while (current < globalStatements.length) {
    if (globalStatements[current].type === 'Macro') {
      if (globalStatements[current].subtype === 'include') {
        console.log('In the near future, included flies from the C standard library will be added!');
        console.log('But we first need to fully compile every valid C syntax!');
      }
    }
    current++;
  }
  return includes;
}
