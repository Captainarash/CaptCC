var keywords = ['auto','double','int',
'struct','break','else','long','switch',
'case','enum','register','typedef','char',
'extern','return', 'union','const','float',
'short','unsigned','continue','for','signed',
'void','default','goto','sizeof','volatile','do',
'if','static','while'];

var dataTypes = ['int','char','float','double','void'];

function verifier(foundFuncs) {
  var names = [];
  for (var i = 0; i < foundFuncs.length; i++) {
    names.push(foundFuncs[i].name);
  }

  if (!verifyFunctionNames(names)) {
    throw new TypeError('error in function definition: duplicate or illigal name!');
  }

  var current = 0;
  while (current < foundFuncs.length) {
    var func = foundFuncs[current];

    if (!verifyReturnType(func.returnType)) {
      throw new TypeError('returnType error in function definition for the function: ' + func.name);
      break;
    }

    if (!verifyFunctionArguments(func.args)) {
      throw new TypeError('Error in function definition: Invalid Arguments!');
      break;
    }

    if (!verifyFunctionBody(func.body)) {
      throw new TypeError('Error! Function Body (Statements) are screwed up!');
      break;
    }

    current++;
  }
  return 1;
}


function verifyFunctionBody(funcBody) {
  var current = 0;
  while (current < funcBody.length) {
    var part = funcBody[current];
    if (part.type === 'Statement') {
      var smallPart = part.value;
      if (smallPart[smallPart.length - 1].type !== 'Terminator') {
        return 0;
      }
      for (var i = 0; i < smallPart.length; i++) {
        if (smallPart[i].value === 'return') {
          if (i !== 0) {
            return 0;
          }
        }
      }
    }

    if (part.type === 'if') {
      var cond = part.condition;
      if (cond.length === 1) {
        if (cond[0].type === 'Word') {
          if (keywords.indexOf(cond[0].value) !== -1) {
            return 0;
          }
        } else if (cond[0].type === 'NumberLiteral') {
            current++;
            continue;
        }
      } else if (cond.length === 3) {
        if (cond[1].type === 'ComparisonE' || cond[1].type === 'ComparisonN' || cond[1].type === 'Greater' || cond[1].type === 'GreaterOrEqual' || cond[1].type === 'Less' || cond[1].type === 'LessOrEqual') {
          if (keywords.indexOf(cond[0].value) === -1 && keywords.indexOf(cond[1].value) === -1) {
            current++;
            continue;
          } else {
            return 0;
          }
        }
      }
      if(!verifyFunctionBody(part.body)){
        return 0;
      }
    }
    current++;
  }
  return 1;
}

function verifyFunctionNames(funcNames) {
  for (var i = 0; i < funcNames.length; i++) {
    if (keywords.indexOf(funcNames[i]) !== -1) {
      return 0;
    }
  }
  var sortedFuncNames = funcNames.slice().sort();
  var duplicates = [];
  for (var i = 0; i < sortedFuncNames.length - 1; i++) {
      if (sortedFuncNames[i + 1] == sortedFuncNames[i]) {
          duplicates.push(sortedFuncNames[i]);
      }
  }
  if (duplicates.length !== 0) {
    return 0;
  }
  return 1;
}

function verifyReturnType(returnType) {
  if (dataTypes.indexOf(returnType) > -1) {
    return 1;
  } else {
    return 0;
  }
}

function verifyFunctionArguments(funcArgs) {
  var current = 0;
  while (current < funcArgs.length) {
    var arg = funcArgs[current];
    if ((dataTypes.indexOf(arg.type) > -1) && (keywords.indexOf(arg.name) === -1)) {
      current++;
      continue;
    } else {
      return 0;
    }
  }
  return 1;
}
