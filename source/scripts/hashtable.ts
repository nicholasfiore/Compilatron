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

    public getName() {
        return this.name;
    }

    //puts an entry into the hash table
    //returns true if successful, false if there is a collision
    public put(key: string, type: string, line: number, scope: string) {
        var hash = this.makeHashCode(key);
        var entry = new HashEntry(key);
        entry.setType(type);
        entry.setLine(line);
        entry.setScope(scope);
        if (!this.table[hash]) {
            this.table[hash] = entry;
            return true;
        } else {
            return false;
        }
    }

    //finds the entry with the id provided and returns it
    public get(id: string) {
        var hash = this.makeHashCode(id);
        
        if (this.table[hash]) {
            return this.table[hash];
        } else {
            return null;
        }
    }

    public getEntries() {
        return this.table;
    }
}

class HashEntry {
    private id;
    private type;
    private isInit;
    private hasBeenUsed;

    private scope;
    private line;
    private position;

    //extra hidden boolean for code gen
    private hasDeclGenerated

    constructor(id: string) {
        this.id = id;
        this.type = "";
        this.scope = "";
        this.line = -1;
        this.isInit = false;
        this.hasBeenUsed = false;
        this.hasDeclGenerated = false;
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
        return this.hasBeenUsed;
    }

    public getDeclGen() {
        return this.hasDeclGenerated;
    }

    public getLine() {
        return this.line;
    }

    public getPos() {
        return this.position;
    }

    public getScope() {
        return this.scope;
    }

    public setType(type: string) {
        this.type = type;
    }

    public setScope(scope: string) {
        this.scope = scope;
    }

    public setLine(line: number) {
        this.line = line;
    }

    public flipIsInit() {
        this.isInit = true;
    }

    public flipBeenUsed() {
        this.hasBeenUsed = true;
    }

    public flipDeclGenerated() {
        this.hasDeclGenerated = true;
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

    public findID(id: string, scope: HashNode): HashEntry{
        var retVal;

        var entry = scope.getTable().get(id);
        if (entry && entry.getDeclGen()) {
            retVal = entry;
        } else {
            scope = scope.getParent();
            retVal = this.findID(id, scope);
        }

        return retVal;
    }

    public findScope(label:string, node: HashNode) {
        var retVal;
        // if (node.getChildren().length === 0) {
        //     if (node.getTable().getName() === label) {
        //         retVal = node;
        //     }
        //     return retVal;
        // }

        node.getChildren().forEach(child => {
            if (child.getTable().getName() === label) {
                retVal = child;
            }
        });
        return retVal;
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
        this.children = new Array<HashNode>;
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