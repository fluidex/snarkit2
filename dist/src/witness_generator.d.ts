declare function compileCircuitDir(circuitDirName: any, { alwaysRecompile, verbose, backend }: {
    alwaysRecompile: any;
    verbose: any;
    backend: any;
}): Promise<{
    circuitFilePath: string;
    r1csFilepath: string;
    symFilepath: string;
    binaryFilePath: string;
}>;
declare class WitnessGenerator {
    circuit: any;
    component: any;
    name: string;
    circuitDirName: string;
    binaryFilePath: string;
    alwaysRecompile: boolean;
    verbose: boolean;
    writeExpectedOutput: boolean;
    backend: string;
    constructor(name: any, { backend, alwaysRecompile, verbose }?: {
        backend: string;
        alwaysRecompile: boolean;
        verbose: boolean;
    });
    compile(circuitDirName: any): Promise<{
        r1csFilepath: string;
        symFilepath: string;
    }>;
    generateWitness(inputFilePath: string, witnessFilePath: string): Promise<void>;
}
export { WitnessGenerator, compileCircuitDir };
