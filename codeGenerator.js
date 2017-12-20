function initGenerate(TheBigAST) {
  globalItems = TheBigAST[0];
  var dataSection = generateDataSection(globalItems);
  console.log(dataSection);
}
function generateTextHeader() {
  var a = '\t.section\t__TEXT,__text,regular,pure_instructions\n';
  return a;
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
    for (var i = 0; i < globalVariables.length; i++) {
      header += '\t.global\t_' + globalVariables[i].name + '\n';
    }
    return header;
}
function generateDataBody(globalVariables) {
  var dataSection = '';
  for (var i = 0; i < globalVariables.length; i++) {
    dataSection += '_' + globalVariables[i].name + ':\n';
    if (globalVariables[i].type === 'int') {
      dataSection += '\t.long\t' + globalVariables[i].value + '\n';
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
