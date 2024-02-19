class Tree {
    private root: TreeNode;
    private currNode: TreeNode;

    constructor() {
        this.root = null;
        this.currNode = null;
    }

    private addNode(label: string) {
        var node = new TreeNode(label);
        if (this.root === null) {
            this.root = node;
            node.setParent(null);
        }
        else {
            
        }
    }

}

class TreeNode {
    private name: string;
    private parent: TreeNode;
    private children: Array<TreeNode>;

    constructor(newName: string) {
        this.name = newName;
    }

    public setParent(node: TreeNode) {
        this.parent = node;
    }

    public addChild(node: TreeNode) {
        this.children.push(node);
    }
}