import { blobs, modules, packref, packs, sha256, textref, texts } from "@hazae41/stdbob"

export namespace addresses {

  export function verify(session: packref): textref {
    const module = packs.get<textref>(session, 0)

    if (!packs.get<bool>(modules.call(module, texts.fromString("verify"), packs.create1(session)), 0))
      throw new Error("Invalid session")

    if (packs.length(session) === 1)
      return module

    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

}