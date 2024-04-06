class HashTable {
    private static readonly HASH_TABLE_SIZE = 26;

    private name: string;
    private table: Array<HashEntry>;

    constructor(name: string) {
        //super(name, false);
        this.name = name;
        this.table = new Array<HashEntry>;
    }

    public makeHashCode(input: string) {
        var hash = input.charCodeAt(0) - 97;
        return hash;
    }

    //puts an entry into the hash table
    //returns true if successful, false if there is a collision
    public put(key: string, type?: string) {
        var hash = this.makeHashCode(key);
        var entry = new HashEntry(key);
        if (type) {
            entry.setType(type);
        }
        if (!this.table[hash]) {
            this.table[hash] = entry;
            return true;
        } else {
            return false;
        }
    }

    //finds the entry with the hash provided and returns it
    public get(hash: number) {
        if (this.table[hash]) {
            return this.table[hash];
        } else {
            return null;
        }
    }
}

class HashEntry {
    private id;
    private type;
    private isInit;
    private hasBeenUsed;

    constructor(id: string) {
        this.id = id;
        this.isInit = false;
        this.hasBeenUsed = false;
    }

    public getID() {
        return this.id;
    }

    public getType() {
        return this.type;
    }

    public getInit() {
        return this.isInit;
    }

    public getBeenUsed() {
        return this.getBeenUsed;
    }

    public setType(type: String) {
        this.type = type;
    }

    public flipIsInit() {
        this.isInit = !this.isInit;
    }

    public flipBeenUsed() {
        this.hasBeenUsed = !this.hasBeenUsed;
    }
}

class HashTree {
    private root: HashNode;
    private currNode: HashNode;

    constructor(name: string) {
        //super(name, false);

    }

    public addNode(table: HashTable) {
        var node = new HashNode(table);
        if (!this.root) {
            this.root = node;
            node.setParent(null);
        } else {
            node.setParent(this.currNode);
            node.getParent().addChild(node);
        }
        this.currNode = node;
    }

    public moveUp() {
        this.currNode = this.currNode.getParent();
    }

    public getCurrent() {
        return this.currNode;
    }

    public getRoot() {
        return this.root;
    }

}

class HashNode {
    private table: HashTable;
    private parent: HashNode;
    private children: Array<HashNode>;

    constructor(newTable: HashTable) {
        this.table = newTable;
    }

    public getTable() {
        return this.table;
    }

    public getParent() {
        return this.parent;
    }

    public getChildren() {
        return this.children;
    }

    public setParent(node: HashNode) {
        this.parent = node;
    }

    public addChild(child: HashNode) {
        this.children.push(child);
    }
}