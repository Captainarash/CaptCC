var stack = [];
function initGenerate(TheBigAST) {
  var globalItems = TheBigAST[0];
  var functionBox = TheBigAST[1];
  var funcsAsm = findFunctionNames(functionBox[0].body);
  var dataSection = generateDataSection(globalItems);
  var textHeader = generateTextHeader(TheBigAST[1]);

  var compiled = textHeader + funcsAsm + dataSection;
  console.log(compiled);
  return 0;
}

function generateFunctionAssembly(functionBody) {
  var current = 0;
  var functionAssembly = "";
  var ifParts = [];
  if (functionBody.length !== 1) {
    functionAssembly += initStack();
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
    }
    current++;
  }
  return functionAssembly;
}

function initStack() {
  var prologue = '\tpush\trbp\n';
  prologue += '\tmov\trbp,rsp\n';
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
  var epilogue = '\tpop\trbp\n';
  stack.pop();
  stack.pop();
  return epilogue;
}

function findFunctionNames(functionPack) {
  var functionNames = [];
  var funcsAsm = '';
  for (var i = 0; i < functionPack.length; i++) {
    functionNames.push(functionPack[i].name);
    funcsAsm += '\t.globl	_' + functionPack[i].name +'\n\n';
    funcsAsm += '_' + functionPack[i].name + ':\n';
    funcsAsm += generateFunctionAssembly(functionPack[i].body);
  }
  return funcsAsm;
}

function generateTextHeader() {
  var header = '\t.section\t__TEXT,__text,regular,pure_instructions\n';
  return header;
}
function generateDataSection(globalItems) {
  var globalVariables = findGlobalVariables(globalItems);
  var dataHeader = generateDataHeader(globalVariables);
  var dataBody = generateDataBody(globalVariables);
  var dataSection = dataHeader + dataBody;
  return dataSection;
}

function generateDataHeader(globalVariables) {
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
    var current = 0;
    var parts = globalStatementsBody[i];
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
          retAsm += '\txor\trax,rax\n';
        } else {
          retAsm += '\tmov\trax,' + returnValue.value + '\n';
        }
        retAsm += '\tret\n\n';
    }
    return retAsm;
}

function generateVariableAssignment(varType, varName, varValue) {
  assignmentAsm = '';
  if (varType === 'int') {
    assignmentAsm += '\tpush\t' + varValue + '\n';
    stack.push({
      type: 'LocalVariable',
      name: varName,
      value: varValue
    });
  }
  return assignmentAsm;
}

function clearStack() {
  var counter = 0;
  for (var i = 0; i < stack.length; i++) {
    if (stack[i].type === 'LocalVariable') {
      counter++;
    }
  }
  var stackClearanceAsm = '\tadd\trsp,' + (counter * 8).toString() + '\n';
  while (counter !== 0) {
    stack.pop();
    counter--;
  }
  return stackClearanceAsm;
}

function generateIncByOne(offset){
    var incAssembly = '';
    if (offset === 0) {
      incAssembly = '\tinc\tDWORD PTR [rsp]\n';
    } else {
      incAssembly = '\tinc\tDWORD PTR +' + (offset * 8).toString() + '[rsp]\n';
    }
    return incAssembly;
}

function generateIfClause(offset, cmpValue, name) {
  var ifClause = '';
  if (offset === 0) {
    ifClause += '\tcmp\tDWORD PTR [rsp],' + cmpValue  + '\n';
  } else {
    ifClause += '\tcmp\tDWORD PTR +' + ((parseInt(offset))*8).toString() + '[rsp],' + cmpValue  + '\n';
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
    assembledifInside += '\tadd\trsp,' + (counter * 8).toString() + '\n';
  }
  assembledifInside += '\n';
  return assembledifInside;
}

function checkForStatements(partValue) {
  var functionAssembly = '';
  if (partValue[0].type === 'Word' && keywords.indexOf(partValue[0].value) !== -1) {
    if (partValue[0].value === 'return') {
      functionAssembly += generateReturn(partValue[1]);
    }
    if (partValue[0].value === 'int') {
        if (partValue.length === 5) {
          functionAssembly += generateVariableAssignment(partValue[0].value, partValue[1].value, partValue[3].value);
        } else if (partValue.length > 5) {
          functionAssembly += generateVariableAssignmentWithAddition(partValue);
        }
    }
  } else if (partValue[0].type === 'Word' && keywords.indexOf(partValue[0].value) === -1) {
    for (var i = 0; i < stack.length; i++) {
      if (stack[i].type === 'LocalVariable') {
        if (stack[i].name === partValue[0].value) {
          if (partValue[1].type === 'IncByOne') {
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

function generateVariableAssignmentWithAddition(statement) {
  var current = 0;
  var counter = 0;
  var sum = 0;
  var statementAssembly = '';
  statementAssembly = '\txor\trax,rax\n';
  while (current < statement.length) {
    if (statement[current].type === 'Equal') {
      var varName = statement[current - 1].value;
      current += 2;
      if (statement[current].type === 'Plus') {
        if (statement[current - 1].type === 'NumberLiteral' && statement[current + 1].type === 'NumberLiteral') {
          sum += parseInt(statement[current - 1].value);
          statementAssembly += '\tadd\trax,' + statement[current - 1].value + '\n';
          sum += parseInt(statement[current + 1].value);
          statementAssembly += '\tadd\trax,' + statement[current + 1].value + '\n';
          counter++;
        }
      }
    }
    current++;
  }
  if (counter !== 0) {
    statementAssembly += '\tpush\trax\n';
    stack.push({
      type: 'LocalVariable',
      name: statement[1].value,
      value: sum
    });
    return statementAssembly;
  }
  return 'Error!';
}
