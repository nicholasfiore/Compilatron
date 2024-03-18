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
        
    }

    
}