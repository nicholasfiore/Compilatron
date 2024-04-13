class Generator extends Component {
    private AST: Tree;
    private symbolTable: Table;
    
    private static readonly MAX_BYTES_MEMORY: number = 256;

    private currByte: number;
    private currTableEntry: number;

    private memory: string[];

    private staticData: StaticEntry[];
    private jumps: JumpEntry[];


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

        this.printCode();
    }

    private initializeCode(node:TreeNode) {
        node.getChildren().forEach(child => {
            switch(child.getName()) {
                case "VarDecl": {
                    this.currTableEntry++;
                    let currEntry = this.symbolTable.getTable()[this.currTableEntry];
                    
                    let label1 = "T" + this.currTableEntry;
                    let label2 = "XX";
                    let id = currEntry.getID();
                    let scope = currEntry.getScope();

                    this.staticData.push(new StaticEntry(label1, label2, id, scope))

                    this.memory[this.currByte] = "A9";
                    this.currByte++;
                    this.memory[this.currByte] = "00";
                    this.currByte++;
                    this.memory[this.currByte] = "8D";
                    this.currByte++;
                    this.memory[this.currByte] = label1;
                    this.currByte++;
                    this.memory[this.currByte] = label2;
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
                    this.memory[this.currByte] = tempStatic.getLabel1();
                    this.currByte++;
                    this.memory[this.currByte] = tempStatic.getLabel2();
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

    }

    private printCode() {
        console.log("here");
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
}

class StaticEntry {
    private label1: string;
    private label2: string;
    private id: string;
    private scope: string;

    constructor(label1:string, label2:string, id:string, scope:string) {
        this.label1 = label1;
        this.label2 = label2;
        this.id = id;
        this.scope = scope;
    }

    public getID() {
        return this.id;
    }
    
    public getScope() {
        return this.scope;
    }

    public getLabel1() {
        return this.label1;
    }

    public getLabel2() {
        return this.label2;
    }
}

class JumpEntry {
    private label: string;
    private distance: number;
}