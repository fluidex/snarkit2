# Using a windows porting for circom2

Currently circom2 which has been rewritten by rust has some issues for being used under native win32, a porting can be found [here](https://github.com/noel2004/circom);

We can just install the porting version:

`cargo install --git https://github.com/noel2004/circom`

You can use the ported circom globally or specify the command path of it by `CIRCOM_PATH` from environment variables

# Generate witness by native backend

  It is not a trivial job to get ready for a enviroment which can be used to generate native backend code and you should follow the following instructions:

## Prerequisite

We need mingw64 target for w64 (NOT win32) and some additional ported libraries:

+ gmp [from MSYS2](https://packages.msys2.org/package/mingw-w64-x86_64-gmp)
+ Nlohmann JSON [from MSYS2](https://packages.msys2.org/package/mingw-w64-x86_64-nlohmann-json)
+ nasm win32 [from MSYS2](https://packages.msys2.org/package/mingw-w64-x86_64-nasm)

Package from MSYS2 can be simply downloaded, extracted and copied to mingw64 directory

+ [win32 porting of mmap](https://github.com/alitrack/mman-win32)(base on `MapviewOfFile` win32 API)

## Notes

+ The default name of target being compiled is 'circuit.exe'

+ Of course only x86_64 arch is the only choice because of the embedded asm code (just in case for somebody planning to apply it on the future ARM windows version ...)

+ The library for finite field provided by circom (iden3/ffiasm) generate embedded asm code with abi comply with [systemV calling convention](https://en.wikipedia.org/wiki/X86_calling_conventions#Microsoft_x64_calling_convention) and has to be patched. See the corresponding [readme](win32/runtime/README.md)

## Linking flags

We need to provide some additional linking flags for building native backend, currently we can just set

`LDFLAGS=-llman`

in your enviroment variables or by .env file
