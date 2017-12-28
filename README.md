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
* Increments (var++)
* Additions and Subtraction
* Global Variables
* Return Statement
* Ifs Only (not nested, not if/elseif/else). Limited Condition support currently.

###### What can be parsed into the AST:

* Every legit character in C syntax
* Everything is grouped and parsed in a meaningful way
* Current groupings are "Global Items" and "Functions" (sorry, no includes)

###### What's missing from the parser:

Structs! :( Will be added soon.

##### Usage in browser console:

    initGenerate(processor(transformer(parser(tokenizer("//some stuff here yeaaah \n int glob = 10; int jack = 36; int test(){return 0;} int main(){int v = 1; int f = 8; v++; f++; int k = -4 - 3 + 5 - 7 - 8 + 2 - 32; int e = v; if(v == 2) {int y = 5; y++;} if(k == 35) {int p = 55 + 34;} return 1;}")))))                   

##### Output:   
	    .section	__TEXT,__text,regular,pure_instructions
	    .globl	_test

    _test:
	    xor	rax,rax
	    ret

	    .globl	_main

    _main:
	    push	rbp
	    mov	rbp,rsp
	    push	1
	    push	8
	    inc	DWORD PTR +8[rsp]
	    inc	DWORD PTR [rsp]
	    xor	rax,rax
	    sub	rax,4
	    sub	rax,3
	    add	rax,5
	    sub	rax,7
	    sub	rax,8
	    add	rax,2
	    sub	rax,32
	    push	rax
	    mov	rax,+16[rsp]
	    push	rax
	    cmp	DWORD PTR +24[rsp],2
	    jne _ifv2_after
	    push	5
	    inc	DWORD PTR [rsp]
	    add	rsp,8

    _ifv2_after:
	    cmp	DWORD PTR +8[rsp],35
	    jne _ifk35_after
	    xor	rax,rax
	    add	rax,55
	    add	rax,34
	    push	rax
	    add	rsp,8

    _ifk35_after:
    	    add	rsp,32
    	    pop	rbp
    	    mov	rax,1
    	    ret

	    .section	__DATA,__data
	    .globl	_glob
    _glob:
	    .long	10

	    .globl	_jack
    _jack:
	    .long	36   
