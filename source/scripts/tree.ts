class Tree extends Component {
    private root: TreeNode;
    private currNode: TreeNode;
    private currDepth: number;

    constructor(name: string) {
        super(name, false); //debugging has to manually set for tree as it's only useful for actual debugging
        this.root = null;
        this.currNode = null;
        this.currDepth = 0;
    }

    public addNode(label: string) {
        console.log("Curr node: " + this.currNode);
        var node = new TreeNode(label);
        if (this.root === null) {
            console.log("root")
            this.root = node;
            node.setParent(null);
            this.debug("Added root " + node.getName());
        }
        else {
            console.log("not root")
            node.setParent(this.currNode);
            node.getParent().addChild(node);
            this.debug("Added branch " + node.getName());
        }
        this.currNode = node;
        console.log("Curr node: " + this.currNode);
        
    }

    //Since terminals are ALWAYS leaf nodes, we can
    //make a specialized function
    public addLeafNode(label: string, value: string) {
        // console.log(this.currNode);
        // console.log(this.currNode.getParent());
        var node = new TreeNode(label, value);
        this.debug("Added leaf " + node.getName());
        node.setParent(this.currNode);
        node.getParent().addChild(node);
    }

    public moveUp() {
        this.debug("Moved up.");
        this.currNode = this.currNode.getParent();
    }

    //performs a depth-first in-order traversal of the tree and prints it
    public printTree(node: TreeNode) {
        //console.log(node);
        if (node.getChildren().length === 0) {
            if (node.getValue()) {
                this.info(this.getDepthStr() + "<" + node.getName() + "[" + node.getValue() + "]>");
            } else {
                if (node.getName() !== "StatementList") {
                    if (node.getName() !== "CharList") {
                        //statementList and charList can have an epsilon transition,
                        //so they shouldn't be printed. This allows printing the AST
                        //to work without breaking printing the CST.
                        this.info(this.getDepthStr() + "[" + node.getName() + "]");
                    }
                }
            }
            this.currDepth -= 1;
            return;
        }

        this.info(this.getDepthStr() + "[" + node.getName() + "]");
        node.getChildren().forEach(e => {
            //console.log("here")
            //console.log(this.currDepth)
            this.currDepth++;
            //console.log("now:" +this.currDepth)
            this.printTree(e);
        });
        this.currDepth--;
        return;
    }

    //like print tree, but just grabs the good parts of the CST in order to build the AST
    public buildAST(node: TreeNode) {
        if (node.getChildren().length === 0) {
            if ([].indexOf(node.getName()) > -1) {
                this.addLeafNode(node.getName(), node.getValue());
                this.moveUp();
            }
            this.currDepth--;
            return;
        }

        

        node.getChildren().forEach(e => {
            console.log("e iteration")
            if (["Block", "PrintStatement", "AssignmentStatement", "IfStatement", "WhileStatement", "VarDecl"].indexOf(e.getName()) > -1) {
                console.log("in here")
                this.addNode(e.getName());
                this.currDepth++;
            } else {
                //this.currNode = e;
            }
            // switch (e.getName()) {
            //     case "[Block]": {

                    
            //         break;
            //     }
            //     case "[PrintStatement]": {

            //         break;
            //     }
            //     case "[AssignmentStatement]": {

            //         break;
            //     }
            //     case "[VarDecl]": {

            //         break;
            //     }
            //     case "[WhileStatement]": {

            //         break;
            //     }
            //     case "[IfStatement]": {

            //         break;
            //     }
            //     case "[]": {

            //         break;
            //     }


            // }
            this.buildAST(e);
        });
        this.moveUp();
        this.currDepth--;
        return;
    }

    public getRoot() {
        return this.root;
    }

    private getDepthStr() {
        var depthStr = "";
        for (var i = 0; i < this.currDepth; i++) {
            depthStr += "-";
        }
        return depthStr;
    }

}

class TreeNode {
    private name: string;
    private value: string;
    private parent: TreeNode;
    private children: Array<TreeNode>;

    constructor(newName: string, newValue?: string) {
        this.name = newName;
        this.value = newValue;
        this.children = new Array<TreeNode>;
    }
    

    public getName() {
        return this.name;
    }

    public getValue() {
        return this.value;
    }

    public getParent() {
        return this.parent;
    }

    public setParent(node: TreeNode) {
        this.parent = node;
    }

    public getChildren() {
        return this.children;
    }

    public addChild(node: TreeNode) {
        this.children.push(node);
    }
}