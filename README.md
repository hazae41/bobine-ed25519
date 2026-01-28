# Ed25519 accounts for Bobine

Use accounts with Ed25519 signatures and incrementing nonce for [Bobine WebAssembly VM](https://github.com/hazae41/bobine)

```tsx
53452f0b3df2bb2aeb6b56a25ff008854f82caa881cf8aa1d230ff7f85bbeb34
```

## Demo

Clone this Git repository

```bash
git clone https://github.com/hazae41/bobine-ed25519.git bobine-ed25519 && cd ./bobine-ed25519
```

Reset the Git repository

```bash
rm -rf ./.git && git init
```

Install dependencies

```bash
npm install
```

If needed modify your server URL in a .env.local file

```env
SERVER=http://localhost:8080
```

Generate an Ed25519 keypair

```bash
npx deno run -A ./run/src/mods/keygen/mod.ts
```

Write it in a .env.local file

```env
SIGKEY=302e020100300506032b657004220420e722733dfaf093dbbdac198e8744faa91add842d5c3078fdcb6f6b070b862dd9
PUBKEY=302a300506032b65700321003307db3f4c10d841905907774ebb894e4cfb89f8a9754f5736288d70c2c593eb
```

Compile and deploy the ed25519 module (it will display the module address)

```bash
npm run prepack && npm run produce
```

Compute your account address using the module address

```bash
npx deno run -A ./run/src/mods/address/mod.ts <ed25519_module_address>
```

Go to ./tst/token

```bash
cd ./tst/token
```

Compile and deploy the token module with your account address as the owner (it will display the module address)

```bash
npm run prepack && npm run produce text:<ed25519_account_address>
```

Go back to the initial folder

```bash
cd ../..
```

Initialize the token module with your account address as the owner

```bash
npm run execute:call <token_module_address> init text:<ed25519_account_address>
```

Mint yourself some tokens (note the `execute:sign` instead of `execute:call`)

```bash
npm run execute:sign <ed25519_module_address> <token_module_address> mint text:<ed25519_account_address> bigint:100
```

Check you have some tokens

```bash
npm run execute:call <token_module_address> get_balance text:<ed25519_account_address>
```

Transfer some tokens to deadbeef

```bash
npm run execute:sign <ed25519_module_address> <token_module_address> transfer text:deadbeef bigint:10
```

Check you have less tokens

```bash
npm run execute:call <token_module_address> get_balance text:<ed25519_account_address>
```

## Usage

### Server-side module

Ensure your target module function accepts a session (packref) as its first parameter, subsequent parameters can be anything you want

```tsx
import { blobs, modules, packref, packs, sha256, textref, texts } from "@hazae41/stdbob"

namespace addresses {

  export function verify(session: packref): textref {
    const module = packs.get<textref>(session, 0)

    if (!packs.get<bool>(modules.call(module, texts.fromString("verify"), packs.create1(session)), 0))
      throw new Error("Invalid session")

    if (packs.length(session) === 1)
      return module

    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

}

export function test(session: packref): bool {
  const caller = addresses.verify(session)

  console.log(caller)

  return true
}
```

### Client-side pseudocode

Generate an Ed25519 keypair

```tsx
const sigkey = generate()
```

Export your public key as SPKI (aka DER aka ASN.1)

```tsx
const pubkey = export("spki", sigpkey)
```

Pack the Ed25519 module address (unprefixed hex text) with your SPKI public key (blob)

```tsx
const encoded = encode([ed25519.toHex(), pubkey])
```

Compute your account address by computing the SHA-256 of the pack

```tsx
const account = sha256(encoded).toHex()
```

Get your nonce (bigint) by executing the `get_nonce(account)` function on the Ed25519 module

```tsx
const nonce = await call<bigint>(ed25519, "get_nonce", [account])
```

Create the payload to your target module and only consider params after the session

```tsx
const message = encode(["17fa1cb5-c5af-4cfd-9bea-1a36590b890d", module, method, params, nonce])
```

In our case params is empty because in our example there is no param after the session

```tsx
const message = encode(["17fa1cb5-c5af-4cfd-9bea-1a36590b890d", module, "test", [], nonce])
```

Sign the payload with your Ed25519 private key

```tsx
const signature = sign(sigkey, message)
```

Execute the `call(module, method, params, pubkey, signature)` function on the Ed25519 module

```tsx
const result = await call(ed25519, "call", [module, method, parse(params), pubkey, signature]))
```

Verify your nonce has been incremented

```tsx
const nonce = await call<bigint>(ed25519, "get_nonce", [account])
```

Done!