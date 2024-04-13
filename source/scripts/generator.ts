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
        
        this.memory = Array(Generator.MAX_BYTES_MEMORY).fill("00");
    }

    public generate() {
        this.initializeCode(this.AST.getRoot());
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
                }
                case "AssignmentStatement": {
                    let currEntry = this.symbolTable.getTable()[this.currTableEntry];


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

    findEntry() {
        
    }
}

class JumpEntry {
    private label: string;
    private distance: number;
}