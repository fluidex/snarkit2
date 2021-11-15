# snarkit2

A toolkit to compile and debug circom circuit.

# Dependencies

Circom has two versions, [the rust-based circom2](https://github.com/iden3/circom), and [the js-based legacy circom](https://github.com/iden3/circom_old). The first is new but fast, the latter is old but stable. 

snarkit2 works with the rust-based version. [The old snarkit](https://github.com/fluidex/snarkit) works with the js circom.

`circom` should be [installed](https://docs.circom.io/getting-started/installation/) in $PATH. 

Linux is the only supported OS.

# Features

### Better support for huge circuits

`snarkit2` supports both wasm witness generator and native(cpp) witness generator.
So compared to the `snarkjs` official tool, `snarkit2` is more friendly for developing huge circuits by using native backend.

### Better error detection

`snarkit2` can print very helpful error messages when the circuit code goes wrong. It can display the code line number and the component/signals related to the error, so we can detect the reason for the error quickly and fix it. Example:

```
# display incorrect component and line number
$ snarkit2 check ./testdata/num2bits_err/

...
Error: Error: Assert Failed. Error in template CheckNumAndBits_0 line: 11
...

```

# Example

The following demos how to test a circuit with given inputs/outputs.

```
$ npm install snarkit2

# first, you should prepare the circuit and input/output as the following structure
# all the input.json/output.json pair inside data/*** folder will be tested
# output.json can be an empty json file if you don't need to test against any circuit outputs.
$ find num2bits/
num2bits/
num2bits/data
num2bits/data/case01
num2bits/data/case01/output.json
num2bits/data/case01/input.json
num2bits/circuit.circom

# snarkit2 has two backend: wasm and native(cpp). Only native backend can process huge circuits, you have to install some dependencies first before using it.

# use wasm backend
# compile the circuit
$ npx snarkit2 compile num2bits --backend wasm
# test the circuit
$ npx snarkit2 check num2bits --backend wasm

# use native backend
# install deps
$ sudo apt install nlohmann-json3-dev nasm g++ libgmp-dev
# compile the circuit
$ npx snarkit2 compile num2bits --backend native
# test the circuit
$ npx snarkit2 check num2bits --backend native
```

