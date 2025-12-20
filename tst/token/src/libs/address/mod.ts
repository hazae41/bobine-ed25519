import { blobs, modules, packref, packs, sha256, textref, texts } from "@hazae41/stdbob"

export namespace addresses {

  /**
   * Compute an address from a session
   * @param module 
   * @param caller 
   * @returns address
   */
  export function compute(session: packref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

  /**
   * Verify a session against forgery and return its address
   * @param session 
   * @returns address
   */
  export function verify(session: packref): textref {
    const module = packs.get<textref>(session, 0)

    if (!packs.get<bool>(modules.call(module, texts.fromString("verify"), packs.create1(session)), 0))
      throw new Error("Invalid session")

    return compute(session)
  }

}