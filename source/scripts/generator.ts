class Generator extends Component {
    private AST: Tree;
    private symbolTable: Table;
    
    private static readonly MAX_BYTES_MEMORY: number = 256;

    private currByte: number;
    private currTableEntry: number;

    private lastCodeByte: number; //the last byte of code (the break)
    private lastStackByte: number; //the last byte used for stack memory

    private memory: string[];

    private staticData: StaticEntry[];
    private jumps: JumpEntry[];

    private validHex = new RegExp('[0-9A-F]')

    constructor(AST: Tree, symbolTable: Table, debug: boolean) {
        super("Code Generator", debug);
        this.AST = AST;
        this.symbolTable = symbolTable;

        this.currByte = 0;
        this.currTableEntry = -1;

        this.staticData = [];
        this.jumps = [];
        
        this.memory = Array(Generator.MAX_BYTES_MEMORY).fill("00");
    }

    public generate() {
        this.initializeCode(this.AST.getRoot());
        this.memory[this.currByte] == "00";
        this.currByte++;
        this.lastCodeByte = this.currByte;

        this.backPatch();

        this.printCode();
    }

    private initializeCode(node:TreeNode) {
        node.getChildren().forEach(child => {
            switch(child.getName()) {
                case "VarDecl": {
                    this.currTableEntry++;
                    let currEntry = this.symbolTable.getTable()[this.currTableEntry];
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
                }
                case "AssignmentStatement": {
                    let currEntry = this.symbolTable.getTable()[this.currTableEntry];
                    let tempStatic = this.findStaticEntry(currEntry.getID(), currEntry.getScope())

                    this.memory[this.currByte] = "A9";
                    this.currByte++;
                    this.memory[this.currByte] = "05";
                    this.currByte++;
                    this.memory[this.currByte] = "8D";
                    this.currByte++;
                    this.memory[this.currByte] = tempStatic.getLabel();
                    this.currByte++;
                    this.memory[this.currByte] = "XX";      
                    this.currByte++;
                }
                case "PrintStatement": {
                    let currEntry = this.symbolTable.getTable()[this.currTableEntry];
                    let tempStatic = this.findStaticEntry(currEntry.getID(), currEntry.getScope())

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
                }
                case "Block": {
                    this.initializeCode(child);
                }
            }
        });
    }

    private allocateStack() {

    }

    private allocateHeap() {

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