TS-Compiler
=====================

This is the Compielrs class initial project written in TypeScript.
See http://www.labouseur.com/courses/compilers/ for details.

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
