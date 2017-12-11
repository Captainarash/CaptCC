var stackuse = 0;
var output = "";
function generateFunction(funcMain) {
  var mainassembly = '';
  var last = 0;
  if(funcMain.type === 'EntryPoint' && funcMain.name === 'main') {
    mainassembly +='\n.section __TEXT\n\t.globl _main\n_main:\n\tpush %ebp\n\tmov %esp,%ebp\n';
    for (var i = 0; i < funcMain.body.length; i++) {
      if(funcMain.body[i].type === 'Word') {
        if(funcMain.body[i].value === 'int') {
          if(funcMain.body[i+1].type === 'Word') {
            if(funcMain.body[i+2].type === 'Sign') {
              if(funcMain.body[i+2].value === '=') {
                if(funcMain.body[i+3].type === 'NumberLiteral') {
                  mainassembly += '\tpush $' + parseInt(funcMain.body[i+3].value).toString(16) + '\n';
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
              mainassembly += '\tadd $4,%esp\n\txor %eax,%eax\n\tpop %ebp\n\tret\n';
            } else {
              mainassembly += '\tadd $4,%esp\n\tmov $'+funcMain.body[last].value.toString(16) + ',%eax\n\tpop %ebp\n\tret\n';
            }
          }
        }
      }
    }
    console.log(mainassembly);
  }
