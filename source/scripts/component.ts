/*  Inspired by the Arnell compiler and the original 6502 buildout project
    All componenets of the compiler (including the whole compiler itself) 
    extends the base class component, which contains the logging function-
    ality*/
namespace TSC {
    export class Component {
        //Components have a name
        name: string;


        constructor(name) {
            this.name = name;
        }


    }
}