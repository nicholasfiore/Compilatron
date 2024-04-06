//semantic analyzer
class SemanticAnalyzer extends Component {
    
    private CST: Tree;
    private tokens: Array<Token>;
    private AST: Tree;


    private ScopeTree: HashTree;

    constructor(ConcreteSyntaxTree: Tree, /*TokenStream: Array<Token>,*/ enableDebug: boolean) {
        super("Semantic Analyzer", enableDebug);
        this.AST = new Tree("AST");
        this.CST = ConcreteSyntaxTree;
        //this.tokens = TokenStream;
    }

    public analyze() {
        this.AST.buildAST(this.CST.getRoot());
        //this.buildAST();
        this.info("Abstract Syntax Tree:");
        console.log(this.AST.getRoot());
        this.AST.printTree(this.AST.getRoot());


    }

    public buildSymbolTable(node: HashNode) {
        if (node.getChildren().length === 0) {
            
            return;
        }
    }

    
    
}