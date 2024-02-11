

function initializeCompiler() {
    console.log("Initializing Compiler");
    var sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
    sourceCode = Utils.trim(sourceCode);
    var _Compiler = new Compiler(sourceCode);
    _Compiler.compile();
}
