/*  Inspired by the Arnell compiler and the original 6502 buildout project
All componenets of the compiler (including the whole compiler itself) 
extends the base class component, which contains the logging function-
ality*/

class Component {
    //Components have a name
    name: string;
    debugMode: boolean;

    constructor(name, isDebug) {
        this.name = name;
        this.debugMode = isDebug;
    }

    //this method of logging was more directly taken from Arnell's compiler
    //I couldn't think of a more succinct implementation that would prevent
    //redundant code throughout the project
    public log(args: string, color?: string) {
        console.log(args + "\n");
        //(<HTMLInputElement>document.getElementById('taOutput')).value += args;
        let div = document.getElementById('taOutput');
        let span = document.createElement('span');
        span.textContent = args + '\n';
        if (color) {
            span.style.color = color;
        }
        div.appendChild(span);
        div.appendChild(document.createElement('br'));
    }

    //inserts a <br> element
    public break() {
        document.getElementById('taOutput').appendChild(document.createElement('br'))
    }
    
    public info(args: string) {
        this.log("INFO " + this.name + ": " + args);
    }

    public debug(args: string) {
        if (this.debugMode) {
            this.log("DEBUG " + this.name + ": " + args, 'blue');
        }
    }

    public warn(args: string) {
        this.log("WARN " + this.name + ": " + args, 'yellow');
    }

    public err(args: string) {
        this.log("ERROR " + this.name + ": " + args, 'red');
    }

    //takes a decimal number and converts it to hex as a string, adding a leading zero if necessary
    public toHexStr(val) {
        let retVal;
        if (val < 16) {
            retVal = "0" + val.toString(16);
        } else {
            retVal = val.toString(16)
        }
        return retVal;
    }
}
