import { bigintref, bigints, blobref, blobs, ed25519, env, modules, packref, packs, refs, storage, textref, texts } from "@hazae41/stdbob"
import { addresses } from "../libs/address/mod"

namespace nonces {

  export function get(address: textref): bigintref {
    const found = storage.get(packs.create2(texts.fromString("nonce"), address))

    if (!found)
      return bigints.zero()

    return packs.get<bigintref>(found, 0)
  }

  export function set(address: textref, value: bigintref): void {
    storage.set(packs.create2(texts.fromString("nonce"), address), value)
  }

}

const sessions = new Set<usize>()

export function get_nonce(address: textref): bigintref {
  return nonces.get(address)
}

export function call(module: textref, method: textref, params: packref, pubkey: blobref, signature: blobref): packref {
  const session = packs.create2(modules.self(), pubkey)
  const address = addresses.compute(session)

  const nonce = nonces.get(address)

  const message = blobs.encode(packs.create5(env.uuid(), module, method, params, nonce))

  if (!ed25519.verify(pubkey, signature, message) && env.mode === 1)
    throw new Error("Invalid signature")

  nonces.set(address, bigints.add(nonce, bigints.one()))

  sessions.add(refs.numerize(session))

  return modules.call(module, method, packs.concat(packs.create1(session), params))
}

export function verify(session: packref): bool {
  return sessions.has(refs.numerize(session))
}