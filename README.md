--there-will-be-huge-rebuild-improvment-update, if I have time :(
contributions are accepted and appreciated.

# CaptCC
A tiny Proof-of-Concept C compiler written purely in JavaScript.   
It's been a while that I learned JS and it has worked for me in many different scenarios.      
I actually learned JS while analyzing a piece of malware written in JS. Then I got really interested.      
I was always curious if I can write a compiler; a tiny one.  
The funny part was writing it in JS :D


Parts of this project is derived from James Kyle talk at EmberConf 2016 (https://www.youtube.com/watch?v=Tar4WgAfMr4).  
I appreciate his effort to make this concept fairly easy to understand.    
He made a Lisp Compiler converting Lisp syntax to JS.   
I want to convert C to ASM.   

###### The parts below are almost complete:

1. tokenizer.js   
2. parser.js   
3. traverser.js   
4. processor.js   

To be completed:   

5. verifier.js   
6. codeGenerator.js     


#### State of the project:

###### What can be compiled:

* Function Definitions
* Integer Variable Assignments
* Char variable Assignments (i.e. char my_name[] = "Arash")
* Increments (var++)
* Additions and Subtraction
* Global Variables
* Return Statement
* Ifs Only (not nested, not if/elseif/else) Limited Condition support currently
* Function Calls with integer arguments

###### What can be parsed into the AST:

* Every legit character in C syntax
* Everything is grouped and parsed in a meaningful way
* Current groupings are "GlobalStatements" and "Functions".
* Inside GlobalStatements, there are Macros (Only #include for now :p), global varibales and structs.

###### What's missing from the parser:

typedef, define, ..., a lot!

##### Usage in browser console (remember to replace the new-lines with the actual \n while copy pasting this):

    initGenerate(processor(transformer(parser(tokenizer("
    //some comment here :D
    int glob = 10;
    int jack = 36;

    void test_void(void){
        int a = 777;
        int b = a;
        b++;
        return;
    }

    int test_int_ret(int a, int b){
        a++;
        b++;
        char my_name[] = \"Arash\";
        return a;
    }

    int main(){
        char greet[] = \"hello\n\";
        int v = 1;
        int f = 8;

        v++;
        f++;

        int k = -4 - 3 + 5 - 7 - 8 + 2 - 32;

        int e = v;

        test(1,2);

        if(v == 2) {
            int y = 5;
            y++;
        }

        if(k == 35) {
            int p = 55 + 34;
        }

	return 1;
    }
    "
    )))))                   

##### Output:   
  .text  
  .globl	_test_void  

  _test_void:  
  push %rbp  
  mov %rsp,%rbp  
  push $666  
  mov 0(%rsp),%rax  
  push %rax  
  incl (%rsp)  
  add $16,%rsp  
  pop %rbp  
  ret  

  .globl	_test_int_ret  

  _test_int_ret:  
  push %rbp    
  mov %rsp,%rbp  
  push %rcx  
  push %rdx  
  incl 8(%rsp)  
  incl (%rsp)  
  mov 8(%rsp), %rax  
  add $16,%rsp  
  pop %rbp  
  ret  
  
  .globl	main

  main:  
  push %rbp  
  mov %rsp,%rbp  
  push $1  
  push $8  
  incl 8(%rsp)  
  incl (%rsp)  
  xor %rax,%rax  
  sub $4,%rax  
  sub $3,%rax  
  add $5,%rax  
  sub $7,%rax  
  sub $8,%rax  
  add $2,%rax  
  sub $32,%rax  
  push %rax  
  mov 16(%rsp),%rax  
  push %rax  
  cmp $2,24(%rsp)  
  jne _ifv2_after  
  push $5    
  incl (%rsp)  
  add $8,%rsp  

   _ifv2_after:  
    cmp $35,8(%rsp)  
    jne _ifk35_after  
    xor %rax,%rax  
    add $55,%rax  
    add $34,%rax   
    push %rax  
    add $8,%rsp  

  _ifk35_after:
    mov $1,%rax  
    add $32,%rsp  
    pop %rbp  
    ret  

  .data    
    .globl	_glob  
    _glob:  
      .long	10  

  .globl	_jack  
    _jack:  
      .long	36  


##### To test the compiler code:

1. Copy the output into a file, let's say compiler_test.s  
2. generate the binary using GCC  

        gcc compiler_test.s -o compiler_test  


3. Run the binary  
