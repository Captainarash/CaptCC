# CaptCC
A tiny C compiler written purely in JavaScript.   
It's been a while that I learned JS and it has worked for me in many different scenarios.      
I actually learned JS while analyzing a piece of malware written in JS. Then I got really interested.      
I was always curious if I can write a compiler; a tiny one. (I changed my mind. Turns out you don't need a master degree to   build one. So, I decided to really work on this compiler.)  
But there was a problem. I didn't know OCaml or Bison or Flex. I wondered why not just write it in JS?   


Parts of this project is derived from James Kyle talk at EmberConf 2016 (https://www.youtube.com/watch?v=Tar4WgAfMr4).  
I appreciate his effort to make this concept fairly easy to understand instead of writing a giant book   
which no ones's gonna read.    
He made a Lisp Compiler converting Lisp syntax to JS.   
I wanna convert C to ASM.   

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
* Current groupings are "Global Items" and "Functions" and "Structs"(sorry, no includes yet but soon...!)

###### What's missing from the parser:

Some minor things like includes and typedefs...

##### Usage in browser console:

    initGenerate(processor(transformer(parser(tokenizer("
    //some comment here :D
    int glob = 10;
    int jack = 36;

    int test(int a, int b){
        a++;
        b++;
        char my_name[] = \"Arash\";
        return 0;
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
    .globl	_test

    _test:
      push %rbp
      mov %rsp,%rbp
      push %rcx
      push %rdx
      incl 8(%rsp)
      incl (%rsp)
      add $16,%rsp
      pop %rbp
      xor %rax,%rax
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
      mov $1,%rcx
      mov $2,%rdx
      call _test
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
      add $32,%rsp
      pop %rbp
      mov $1,%rax
      ret

    .data
    .globl	_glob
    _glob:
      .long	10

    .globl	_jack
    _jack:
      .long	36


    L_test_my_name:
      .ascii	"arash"

    L_main_greet:
      .ascii	"hello\n"


##### To test the compiler code:

1. Copy the output into a file, let's say compiler_test.s  
2. generate the binary using GCC  

        gcc compiler_test.s -o compiler_test  


3. Run the binary  
