import { blobref, blobs, modules, packref, packs, sha256, textref, texts } from "@hazae41/stdbob"

export namespace addresses {

  /**
   * Compute an address from a module and public key
   * @param module 
   * @param pubkey 
   * @returns 
   */
  export function compute(module: textref, pubkey: blobref): textref {
    return blobs.toBase16(blobs.slice(sha256.digest(blobs.encode(packs.create2(module, pubkey))), 12, 32))
  }

  /**
   * Verify a session and return the address
   * @param session 
   * @returns 
   */
  export function verify(session: packref): textref {
    const module = packs.get<blobref>(session, 0)
    const pubkey = packs.get<blobref>(session, 1)

    if (!packs.get<bool>(modules.call(module, texts.fromString("verify"), packs.create1(session)), 0))
      throw new Error("Invalid session")

    return compute(module, pubkey)
  }

}