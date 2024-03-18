//semantic analyzer
class SemanticAnalyzer extends Component {
    private AST: Tree

    constructor(CST: Tree, enableDebug: boolean) {
        super("Semantic Analyzer", enableDebug);
        this.AST = new Tree("AST");
    }


    public buildAST(CST: Tree): Tree {
        
        return;
    }
}