class Generator extends Component {
    private AST: Tree;
    private symbolTable;
    
    private static readonly MAX_BYTES_MEMORY: number = 256;

    private memory: string[];


    constructor(AST: Tree, symbolTable: HashTree, debug: boolean) {
        super("Code Generator", debug);
        this.AST = AST;
        this.symbolTable = symbolTable;
        
        this.memory = Array(Generator.MAX_BYTES_MEMORY).fill("00");
    }

    public generate() {
        this.initializeCode(this.AST.getRoot());
    }

    private initializeCode(node:TreeNode) {
        node.getChildren().forEach(child => {
            
        });
    }

    private allocateStack() {

    }

    private allocateHeap() {

    }

    private backPatch() {

    }

    
}

class TempEntry {
    private label: string;
    private id: string;
    private scope: string;

    constructor(label:string, id:string, scope:string) {
        this.label = label;
        this.id = id;
        this.scope = scope;
    }
}