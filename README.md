# CaptCC
A tiny C compiler written purely in JavaScript.   
It's been a while that I learned JS and it has worked for me in many different scenarios.    
I actually learned JS while analyzing a piece of malware written in JS. Then I got really interested.   
I was always curious if I can write a compiler; a tiny one. But there was a problem. I didn't know OCaml or Bison or Flex.   
I wondered why not just write it in JS?   


Parts of this project is derived from James Kyle talk at EmberConf 2016 (https://www.youtube.com/watch?v=Tar4WgAfMr4).   
He made a Lisp Compiler to convert the Lisp syntax to JS.   
I want to convert C to ASM like a normal compiler does.   

The project is still in its baby steps so please don't expect it to compile everything.   
Below is the stage of the compiler which tell what the compiler can compile now:   

###### Source:   

    int test(){return 0;}int main(){int a = 45; return 1;}

###### Output:

    .section __TEXT
        .globl _main
        .globl _test
    _main:
        push %ebp
        mov %esp,%ebp
        push $2d
        add $44,%esp
        mov $1,%eax
        pop %ebp
        ret
    _test:
        push %ebp
        mov %esp,%ebp
        pop %ebp
        xor %eax,%eax
        ret 
   
   

###### USAGE:   
   
        generateMain(processor(transformer(parser(tokenizer("int test(){return 0;} int main(){int a = 212;return 1;}")))))
        generateFunc(foundFuncs)
        wrapUp()  
