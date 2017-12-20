function initGenerate(TheBigAST) {
  var globalItems = TheBigAST[0];

  var dataSection = generateDataSection(globalItems);
  var functionPack = generateTextHeader(TheBigAST[1]);
  var functionPack = TheBigAST[1];

  console.log(dataSection);
}

function findFunctionNames(functionPack) {
  var functionNames = [];
  for (var i = 0; i < functionPack.length; i++) {
    functionNames.push(functionPack[i].name);
  }
  return functionNames;
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
