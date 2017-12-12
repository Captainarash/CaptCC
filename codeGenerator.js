var stackuse = 0;
var output = "";
var header = '.section __TEXT\n';
var funcList = '';
var allAsm = '';
var funcAsm = [];
var mainassembly = '';
function generateMain(funcMain) {
  var last = 0;
  //console.log(funcMain);
  if(funcMain.type === 'EntryPoint' && funcMain.name === 'main') {
    funcList += '\t.globl _main\n';
    mainassembly +='_main:\n\tpush %ebp\n\tmov %esp,%ebp\n';
    for (var i = 0; i < funcMain.body.length; i++) {
      if(funcMain.body[i].type === 'Word') {
        if(funcMain.body[i].value === 'int') {
          if(funcMain.body[i+1].type === 'Word') {
            if(funcMain.body[i+2].type === 'Sign') {
              if(funcMain.body[i+2].value === '=') {
                if(funcMain.body[i+3].type === 'NumberLiteral') {
                  mainassembly += '\tpush $' + parseInt(funcMain.body[i+3].value).toString(16) + '\n';
                  stackuse++;
                  last = i + 3;
                  break;
                  }
                }
              }
            }
          }
        }
      }
      if(funcMain.body[++last].type === 'Word') {
        if (funcMain.body[last].value === 'return') {
          if (funcMain.body[++last].type === 'NumberLiteral') {
            if (funcMain.body[last].value === '0') {
              mainassembly += '\tadd $'+ stackuse*4 +',%esp\n\txor %eax,%eax\n\tpop %ebp\n\tret\n';
            } else {
              mainassembly += '\tadd $'+ stackuse*4 +',%esp\n\tmov $'+funcMain.body[last].value.toString(16) + ',%eax\n\tpop %ebp\n\tret\n';
            }
          }
        }
      }
    }
    //console.log(mainassembly);
  }

function generateFunc(foundF) {

  var asmCount = 0;
  var mainCount = 0;
  for (var i = 0; i < foundF.length; i++) {
    if (foundF[i].name === 'main') {
      mainCount++;
      continue;
    }
    funcList += '\t.globl _' + foundF[i].name + '\n';
    funcAsm.push(
      '_' + foundF[i].name + ':\n\tpush %ebp\n\tmov %esp,%ebp\n'
    );
    var fBody = foundF[i].body;

    if (foundF[i].returnType === 'int') {
      if (fBody[0].value === 'return') {
        if (fBody[1].type === 'NumberLiteral') {
          funcAsm[i] += '\tpop %ebp\n';
          if (fBody[1].value === '0') {
            funcAsm[i] += '\txor %eax,%eax\n\tret\n';
          }
          else {
          funcAsm[i] += '\tmov $'+ parseInt(fBody[1].value).toString(16) +',%eax\n\tret\n';
          }
        }
      }
    }
    //console.log(funcAsm[i]);
  }
}

function wrapUp() {
  var total = 0
  allAsm = header + funcList + mainassembly;
  if (funcAsm.length != 0) {
    while (total < funcAsm.length) {
      allAsm += funcAsm[total];
      total++;
    }
  }
  console.log(allAsm);
}
