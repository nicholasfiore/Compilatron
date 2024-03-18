//semantic analyzer
class SemanticAnalyzer extends Component {
    
    private CST: Tree;
    private AST: Tree;

    constructor(ConcreteSyntaxTree: Tree, enableDebug: boolean) {
        super("Semantic Analyzer", enableDebug);
        this.AST = new Tree("AST");
        this.CST = ConcreteSyntaxTree;
    }

    public analyze() {
        console.log("here1")
        this.AST.buildAST(this.CST.getRoot());
        console.log("here2")
        this.AST.printTree(this.AST.getRoot());
    }

    
}