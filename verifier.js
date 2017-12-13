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
    if (!verify_return_type(func.returnType)) {
      console.log('return Type error in fuction definition for the function: ' + func.name);
      break;
    }
    current++;
  }
}

function verify_return_type(returnType) {
  for (var i = 0; i < keywords.length; i++) {
    if (keywords[i] === returnType) {
      for (var i = 0; i < dataTypes.length; i++) {
        if (dataTypes[i] === returnType) {
          return 1;
        } else {
          return 0;
        }
      }
    } else {
      return 0;
    }
  }
}
