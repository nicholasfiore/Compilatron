Compilatron
================
Compilatron is a compiler written in Typescript for compiling a simple, LL(1) grammar designed by Dr. Alan Labouseur. Compiled code generates opcodes for a reduced 6502 instruction set, which is the instruction set used for the projects in the [Operating Systems](https://www.labouseur.com/courses/os) course taught by Dr. Labouseur. The Baur-Nackus form of the grammar can be found [here](https://www.labouseur.com/courses/compilers/grammar.pdf).


More information regarding the project and his Compiler Design and Implementation course can be found on Dr. Labouseur's [website](https://www.labouseur.com/courses/compilers/).


Note, the initial commit for this repo was based on https://github.com/AlanClasses/TS-Compiler

Setup TypeScript
================
1. Install [npm](https://www.npmjs.org/), if you don't already have it
1. `npm install -g typescript` to get the TypeScript Compiler


Setup TypeScript
================
1. Install [npm](https://www.npmjs.org/), if you don't already have it


Optional: Setup Gulp 
====================
1. `npm install -g gulp` to get the Gulp Task Runner
1. `npm install -g gulp-tsc` to get the Gulp TypeScript plugin

Gulp Workflow
------------

Run `gulp` at the command line in the root directory of this project. 
Edit your TypeScript files in the source/scripts directory in your favorite editor. Visual Studio Code has some additional tools that make debugging, syntax highlighting, and more very easy. 
IntelliJ looks like a nice option as well.

Gulp will automatically:
* Watch for changes in your source/scripts/ directory for changes to .ts files and run the TypeScript Compiler on it
* Watch for changes to your source/styles/ directory for changes to .css files and copy them to the dist/ folder

FAQs
==================

**What's TypeScript?**
TypeScript is a language that allows you to write in a statically-typed language that outputs standard JavaScript.

**Why should I use TypeScript?**
This will be especially helpful for an OS or a Compiler that may need to run in the browser as you will have all of the great benefits of scope and type checking built right into your language.

**Where can I get more info on TypeScript**
[Right this way!](http://www.typescriptlang.org/)

**Where can I get more info on Gulp?**
[Right this way!](http://gulpjs.com/)
