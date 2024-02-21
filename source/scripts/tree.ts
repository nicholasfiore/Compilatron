class Tree extends Component {
    private root: TreeNode;
    private currNode: TreeNode;
    private currDepth: number;

    constructor(name: string) {
        super(name, false); //debugging has to manually set for tree as it's only useful for actual debugging
        this.root = null;
        this.currNode = null;
        this.currDepth = -1;
    }

    public addNode(label: string) {
        var node = new TreeNode(label);
        if (this.root === null) {
            this.root = node;
            node.setParent(null);
            this.debug("Added root " + node.getName());
        }
        else {
            node.setParent(this.currNode);
            node.getParent().addChild(node);
            this.debug("Added branch " + node.getName());
        }
        this.currNode = node;
    }

    //Since terminals are ALWAYS leaf nodes, we can
    //make a specialized function
    public addLeafNode(label: string) {
        var node = new TreeNode(label);
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
        
        console.log("depth: " +this.currDepth);

        var depthStr: string = "";
        for (var i = 0; i < this.currDepth; i++) {
            depthStr += "-";
        }
        console.log("DepthStr1: " +depthStr);

        if (node.getChildren().length === 0) {
            this.info(depthStr + "<" + node.getName() + ">");
            this.currDepth -= 1;
            return;
        } else {
            this.currDepth++;
        }

        //reset depth str
        depthStr = "";
        console.log("DepthStr reset: " +depthStr);
        for (var i = 0; i < this.currDepth; i++) {
            depthStr += "-";
        }
        console.log("DepthStr2: " +depthStr);
        
        this.info(depthStr + "[" + node.getName() + "]");
        node.getChildren().forEach(e => {
            this.printTree(e);
        });
    }

    public getRoot() {
        return this.root;
    }

}

class TreeNode {
    private name: string;
    private parent: TreeNode;
    private children: Array<TreeNode>;

    constructor(newName: string) {
        this.name = newName;
        this.children = new Array<TreeNode>;
    }

    public getName() {
        return this.name;
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