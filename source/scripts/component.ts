/*  Inspired by the Arnell compiler and the original 6502 buildout project
All componenets of the compiler (including the whole compiler itself) 
extends the base class component, which contains the logging function-
ality*/

class Component {
    //Components have a name
    name: string;


    constructor(name) {
        this.name = name;
    }

    //this method of logging was more directly taken from Arnell's compiler
    //I couldn't think of a more succinct implementation that would prevent
    //redundant code throughout the project
    public log(args: string) {
        console.log(args + "\n"); //includes non-null assertion
    }
    
    public info(args: string) {
        this.log("INFO " + this.name + ": " + args);
    }

    public warn(args: string) {
        this.log("WARN " + this.name + ": " + args);
    }

    public err(args: string) {
        this.log("ERROR " + this.name + ": " + args);
    }
}