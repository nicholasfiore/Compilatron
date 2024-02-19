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
}