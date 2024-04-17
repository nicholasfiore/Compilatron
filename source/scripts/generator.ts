class Generator extends Component {
    private AST: Tree;
    //private symbolTable: Table;
    private symbolTable: HashTree;
    
    private static readonly MAX_BYTES_MEMORY: number = 256;

    private currByte: number;
    private currTableEntry: number;

    private lastCodeByte: number; //the last byte of code (the break)
    private lastStackByte: number; //the last byte used for stack memory

    private currHeapLoc: number = 256;

    private memory: string[];

    private currDepth: number = -1;
    private currScope: HashNode;
    private currScopeLabel: string;
    private repeatScope: string[] = new Array<string>;

    private errors;

    private staticData: StaticEntry[];
    private jumps: JumpEntry[];

    private validHex = new RegExp('[0-9A-F]')

    constructor(AST: Tree, symbolTable: HashTree, debug: boolean) {
        super("Code Generator", debug);
        this.AST = AST;
        //this.symbolTable = symbolTable;
        this.symbolTable = symbolTable;

        this.currByte = 0;
        this.currTableEntry = -1;

        this.currScope = symbolTable.getRoot();

        this.staticData = [];
        this.jumps = [];
        
        this.memory = Array(Generator.MAX_BYTES_MEMORY).fill("00");
    }

    public generate() {
        this.initializeCode(this.AST.getRoot());
        this.memory[this.currByte] = "00"; //ensures the last byte of code is a break
        this.lastCodeByte = this.currByte;

        this.backPatch();

        this.printCode();
    }

    private initializeCode(node:TreeNode) {
        
        if (this.currDepth < 0) {
            this.currDepth++;
            this.repeatScope[0] = "";
            this.currScopeLabel = "0 ";
            this.initializeCode(node);
        } else {
            node.getChildren().forEach(child => {
                let subChild1 = child.getChildren()[0];
                let subChild2 = child.getChildren()[1];
                switch(child.getName()) {
                    case "VarDecl": {
                        this.currTableEntry++;
                        let currEntry = this.symbolTable.findID(subChild2.getValue(), this.currScope);
                        let label = "T" + this.currTableEntry;
                        
                        let id = currEntry.getID();
                        let scope = currEntry.getScope();

                        this.staticData.push(new StaticEntry(label, id, scope))

                        this.memory[this.currByte] = "A9";
                        this.currByte++;
                        this.memory[this.currByte] = "00";
                        this.currByte++;
                        this.memory[this.currByte] = "8D";
                        this.currByte++;
                        this.memory[this.currByte] = label;
                        this.currByte++;
                        this.memory[this.currByte] = "XX";
                        this.currByte++;
                        break;
                    }
                    case "AssignmentStatement": {
                        //let currEntry = this.symbolTable.findID(subChild1.getValue(), this.currScope);
                        let tempStatic = this.findStaticEntry(subChild1.getValue(), this.currScope.getTable().getName());
                        let valNode = child.getChildren()[1];
                        let val;
                        if (valNode.getName() === "DIGIT") {
                            val = parseInt(valNode.getValue());
                            let constant = this.toHexStr(val);

                            this.memory[this.currByte] = "A9";
                            this.currByte++;
                            this.memory[this.currByte] = constant;
                            this.currByte++;
                            this.memory[this.currByte] = "8D";
                            this.currByte++;
                            this.memory[this.currByte] = tempStatic.getLabel();
                            this.currByte++;
                            this.memory[this.currByte] = "XX";      
                            this.currByte++;
                        } else if (valNode.getName() === "ID") {
                            val = this.findStaticEntry(subChild2.getValue(), this.symbolTable.findID(subChild2.getValue(), this.currScope).getScope())
                        } else {
                            val = this.allocateHeap(child.getChildren()[1].getValue())
                            let address = this.toHexStr(val);

                            this.memory[this.currByte] = "A9";
                            this.currByte++;
                            this.memory[this.currByte] = address;
                            this.currByte++;
                            this.memory[this.currByte] = "8D";
                            this.currByte++;
                            this.memory[this.currByte] = tempStatic.getLabel();
                            this.currByte++;
                            this.memory[this.currByte] = "XX";      
                            this.currByte++;
                        }
                        break;
                    }
                    case "PrintStatement": {
                        //let currEntry = this.symbolTable.getTable()[this.currTableEntry];
                        let tempStatic = this.findStaticEntry(subChild1.getValue(), this.currScope.getTable().getName());

                        //code for digits
                        this.memory[this.currByte] = "AC";
                        this.currByte++;
                        this.memory[this.currByte] = tempStatic.getLabel();
                        this.currByte++;
                        this.memory[this.currByte] = "XX";
                        this.currByte++;
                        this.memory[this.currByte] = "A2";
                        this.currByte++;
                        this.memory[this.currByte] = "01";
                        this.currByte++;
                        this.memory[this.currByte] = "FF";
                        this.currByte++;
                        break;
                    }
                    case "Block": {
                        this.currDepth++;
                        this.currScopeLabel = this.labelScope(this.currDepth);
                        this.currScope = this.symbolTable.findScope(this.currScopeLabel, this.currScope)
                        this.initializeCode(child);
                    }
                }
            });
            this.currDepth--;
            this.currScope = this.currScope.getParent();
        }
    }

    private labelScope(depth:number) {
        let currSubLabel;
        if (this.repeatScope.length-1 < depth) {
            this.repeatScope.push("a");
            currSubLabel = this.repeatScope[depth];
        } else {
            currSubLabel = this.repeatScope[depth];
            let temp = currSubLabel.charCodeAt(0);
            currSubLabel = String.fromCharCode(temp + 1);
            this.repeatScope[depth] = currSubLabel;
        }
        return depth + currSubLabel;
    }

    // public findID(id: string, scope: string, currScope: HashNode) {
    //     let thisScope 
    // }

    private allocateStack() {

    }

    //allocates a string into heap memory
    //if there is an error, returns -1. Otherwise, returns the memory location of the first character
    private allocateHeap(charlist: string) {
        this.currHeapLoc = this.currHeapLoc - (charlist.length + 1);

        if (this.currHeapLoc <= this.lastStackByte) {
            this.err("Cannot generate code: out of memory (heap)");
            this.errors++;
            return -1;
        } else {
            let i;
            for (i = 0; i < charlist.length; i++) {
                this.memory[this.currHeapLoc + i] = charlist.charCodeAt(i).toString(16);
            }
            this.memory[this.currHeapLoc + i] = "00";
            return this.currHeapLoc;
        }

        


    }

    private backPatch() {
        let stackByte = this.lastCodeByte + 1;
        //replace static data labels
        this.staticData.forEach(entry => {
            for (let i = 0; i < this.memory.length; i++) {
                if (entry.getLabel() === this.memory[i]) {
                    this.memory[i] = stackByte.toString(16);
                    this.memory[i + 1] = "00";//little endian with 256 available bytes means this is always 00
                    i++; //since we're also replacing the next byte, increment i an additional time
                }
            }
            stackByte++;
        });
        this.lastStackByte = stackByte;

        //replace jump labels
    }

    private printCode() {
        (<HTMLInputElement>document.getElementById('codeOut')).value += this.memory.join(" ");
    }

    private findStaticEntry(id:string, scope:string) {
        for (var i = 0; i < this.staticData.length; i++) {
            let entry = this.staticData[i];
            if (entry.getID() === id && entry.getScope() === scope) {
                return entry;
            }
        }
        return null;
    }

    //ensures the code are all hex codes before sending it to be printed. Useful for bugtesting.
    private checkHexValidity(arr:string[]) {
        let invalidFlag = false;
        arr.forEach(byte => {
            if (!this.validHex.test(byte)) {
                invalidFlag = true;
            }
        });
        return !invalidFlag; //return true if the hex is valid, false if it invalid
    }
}

class StaticEntry {
    private label: string;

    private id: string;
    private scope: string;

    constructor(label:string, id:string, scope:string) {
        this.label = label;
        this.id = id;
        this.scope = scope;
    }

    public getID() {
        return this.id;
    }
    
    public getScope() {
        return this.scope;
    }

    public getLabel() {
        return this.label;
    }
}

class JumpEntry {
    private label: string;
    private distance: number;
}