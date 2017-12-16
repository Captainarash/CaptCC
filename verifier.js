var keywords = ['auto','double','int',
'struct','break','else','long','switch',
'case','enum','register','typedef','char',
'extern','return', 'union','const','float',
'short','unsigned','continue','for','signed',
'void','default','goto','sizeof','volatile','do',
'if','static','while'];

var dataTypes = ['int','char','float','double','void'];

function verifier(foundFuncs) {
  var current = 0;
  while (current < foundFuncs.length) {
    var func = foundFuncs[current];
    if (!verifyReturnType(func.returnType)) {
      throw new TypeError('return Type error in function definition for the function: ' + func.name);
      break;
    }
    if (!verifyFunctionArguments(func.args)) {
      throw new TypeError('Error in function definition: Invalid Arguments!');
      break;
    }
    current++;
  }
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
