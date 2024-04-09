class Generator extends Component {
    private AST: Tree;
    private symbolTable;
    
    private static readonly MAX_BYTES_MEMORY: number = 256;

    private machineCode: string[];


    constructor(AST: Tree, symbolTable: HashTree, debug: boolean) {
        super("Code Generator", debug);
        this.AST = AST;
        this.symbolTable = symbolTable;
        
        this.machineCode = Array(Generator.MAX_BYTES_MEMORY).fill("00");
    }
}