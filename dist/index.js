"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCircuitDir = exports.compileCircuitDir = void 0;
const witness_generator_1 = require("./src/witness_generator");
const path = require("path");
const walkSync = require('walk-sync');
async function compileCircuitDir(circuitDir, options) {
    const circuitName = path.basename(circuitDir);
    let witnessGenerator = new witness_generator_1.WitnessGenerator(circuitName, options);
    await witnessGenerator.compile(circuitDir);
}
exports.compileCircuitDir = compileCircuitDir;
// in the new rust circom, constraints are already checked in the witgen process
// so we need not check again manually.
async function testCircuitDir(circuitDir, dataDir, options) {
    // make sure the circuit is compiled
    const circuitName = path.basename(circuitDir);
    let witnessGenerator = new witness_generator_1.WitnessGenerator(circuitName, options);
    await witnessGenerator.compile(circuitDir);
    if (dataDir == null || dataDir == '') {
        dataDir = circuitDir;
    }
    for (const input of walkSync(path.resolve(dataDir), { includeBasePath: true, globs: ['**/input.json'] })) {
        const testCaseDir = path.normalize(path.dirname(input));
        console.log('\ntest', testCaseDir);
        const inputFile = path.join(testCaseDir, 'input.json');
        const witnessFileType = options.witnessFileType == 'bin' || options.witnessFileType == 'wtns' ? 'wtns' : 'json';
        const witnessFile = path.join(testCaseDir, 'witness.' + witnessFileType);
        await witnessGenerator.generateWitness(inputFile, witnessFile);
        console.log('\ntest', testCaseDir, 'done');
    }
}
exports.testCircuitDir = testCircuitDir;
//# sourceMappingURL=index.js.map