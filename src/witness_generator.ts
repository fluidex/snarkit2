import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs';
const si = require('systeminformation');

function isEmptyFile(filePath) {
  return !fs.existsSync(filePath) || fs.statSync(filePath).size == 0;
}

function shellExec(cmd, verbose, printRunTime = false, fatal = true, shelljsOptions: any = {}) {
  if (verbose) {
    console.log(cmd);
    shelljsOptions.silent = !verbose;
  }
  if (printRunTime) {
    if (process.platform == 'linux') {
      cmd = `/usr/bin/time -v ${cmd}`;
    } else if (process.platform == 'darwin') {
      cmd = `/usr/bin/time -l ${cmd}`;
    } else {
      //console.warn('in windows we can not timing the compilation');
    }
  }
  if (fatal) {
    shelljsOptions.fatal = true;
  }
  let res = shelljs.exec(cmd, shelljsOptions);
  if (fatal) {
    if (res.code != 0) {
      throw new Error(`\n\n\nExec failed::\n ${cmd}\n\n`);
    }
  }
}

function getCircomCli(): string {
  let circomcliPath = process.env.CIRCOM_PATH || shelljs.which('circom');
  if (!circomcliPath) {
    throw new Error('circom is not installed. please install it following https://github.com/iden3/circom');
  }
  return circomcliPath;
}

async function compileWasmBinary({ circuitFilePath, circuitDirName, binaryFilePath, verbose }) {
  let cmd = `${getCircomCli()} --r1cs --wasm --sym --output ${circuitDirName} ${circuitFilePath}`;
  shellExec(cmd, verbose, verbose);
}

async function compileNativeBinary({ circuitFilePath, circuitDirName, binaryFilePath, verbose }) {
  let cmd = `${getCircomCli()} --r1cs --c --sym --output ${circuitDirName} ${circuitFilePath}`;
  shellExec(cmd, verbose, verbose);

  const cFilepath = path.join(circuitDirName, 'circuit_cpp', 'circuit.cpp');
  if (isEmptyFile(cFilepath)) {
    throw new Error('compile cpp failed');
  }

  let compileCmd = `make`;
  shellExec(compileCmd, verbose, false, true, { cwd: path.join(circuitDirName, 'circuit_cpp') });
}

async function compileCircuitDir(circuitDirName, { forceRecompile, verbose, backend }) {
  // console.log('compiling dir', circuitDirName);
  const circuitFilePath = path.join(circuitDirName, 'circuit.circom');
  const r1csFilepath = path.join(circuitDirName, 'circuit.r1cs');
  const symFilepath = path.join(circuitDirName, 'circuit.sym');
  let binaryFilePath: string;
  if (backend === 'native') {
    binaryFilePath = path.join(circuitDirName, 'circuit_cpp', 'circuit');
    if (process.platform === 'win32') {
      binaryFilePath += '.exe';
    }
  } else {
    binaryFilePath = path.join(circuitDirName, 'circuit_js', 'circuit.wasm');
  }
  if (!isEmptyFile(binaryFilePath) && !forceRecompile) {
    if (verbose) {
      console.log('skip compiling binary ', binaryFilePath);
    }
    return { circuitFilePath, r1csFilepath, symFilepath, binaryFilePath };
  }

  console.log('compile', circuitDirName);
  if (backend === 'native') {
    await compileNativeBinary({
      circuitFilePath,
      circuitDirName,
      binaryFilePath,
      verbose,
    });
  } else {
    await compileWasmBinary({ circuitFilePath, circuitDirName, binaryFilePath, verbose });
  }
  if (isEmptyFile(binaryFilePath)) {
    throw new Error('compile binary failed');
  }
  return { circuitFilePath, r1csFilepath, symFilepath, binaryFilePath };
}

class WitnessGenerator {
  circuit: any;
  component: any;
  name: string;
  circuitDirName: string;
  binaryFilePath: string;
  forceRecompile: boolean;
  sanityCheck: boolean;
  verbose: boolean;
  writeExpectedOutput: boolean;
  backend: string;
  constructor(name, { backend, forceRecompile, verbose } = { backend: 'native', forceRecompile: true, verbose: false }) {
    this.name = name;
    // force recompile even the witgen binary exists
    this.forceRecompile = forceRecompile;
    this.verbose = verbose;
    this.backend = backend;
  }

  async chooseBackend() {
    const needFeatures = ['bmi2', 'adx'];
    let cpuFeatures = (await si.cpu()).flags.split(/\s/);
    if (process.platform === 'darwin') {
      const stdout = shelljs.exec('sysctl machdep.cpu.leaf7_features', { silent: true });
      const features = stdout.trim().toLowerCase().split(/\s/).slice(1);
      cpuFeatures.push(...features);
    }
    for (const f of needFeatures) {
      if (!cpuFeatures.includes(f)) {
        console.log(`cpu missing needed feature ${f} for native backend, fallback to wasm`);
        console.log(`cpus earlier than Intel Boradwell / AMD Ryzen are not supported for native backend`);
        return 'wasm';
      }
    }
    return 'native';
  }

  async compile(circuitDirName) {
    this.circuitDirName = path.resolve(circuitDirName);
    if (this.backend === 'auto') {
      this.backend = await this.chooseBackend();
    }

    const { r1csFilepath, symFilepath, binaryFilePath } = await compileCircuitDir(this.circuitDirName, {
      forceRecompile: this.forceRecompile,
      verbose: this.verbose,
      backend: this.backend,
    });
    this.binaryFilePath = binaryFilePath;
    return { r1csFilepath, symFilepath };
  }

  async generateWitness(inputFilePath: string, witnessFilePath: string) {
    var cmd: string;
    if (this.binaryFilePath == '' || !fs.existsSync(this.binaryFilePath)) {
      throw new Error('invalid bin ' + this.binaryFilePath + '. Has the circuit been compiled?');
    }
    if (!witnessFilePath.endsWith('.json') && !witnessFilePath.endsWith('.wtns')) {
      throw new Error('invalid witness file type');
    }
    // gen witness
    if (this.backend === 'native') {
      cmd = `${this.binaryFilePath} ${inputFilePath} ${witnessFilePath}`;
      shellExec(cmd, this.verbose);
    } else {
      // wasm cannot produce json witness file
      let witnessBinFile;
      if (witnessFilePath.endsWith('.json')) {
        witnessBinFile = witnessFilePath.replace(/json$/, 'wtns');
      } else {
        witnessBinFile = witnessFilePath;
      }

      const witGenScript = path.join(this.circuitDirName, 'circuit_js', 'generate_witness.js');
      cmd = `node ${witGenScript} ${this.binaryFilePath} ${inputFilePath} ${witnessBinFile}`;
      shellExec(cmd, this.verbose);

      // convert bin witness to json witness if needed
      if (witnessFilePath.endsWith('.json')) {
        const snarkjsPath = path.join(require.resolve('snarkjs'), '..', 'cli.cjs');
        cmd = `node ${snarkjsPath} wej ${witnessBinFile} ${witnessFilePath}`;
        shellExec(cmd, {}, this.verbose);
      }
    }
  }
}

export { WitnessGenerator, compileCircuitDir };
