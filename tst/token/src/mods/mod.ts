import { bigintref, bigints, blobs, modules, packref, packs, sha256, storage, textref, texts } from "@hazae41/stdbob"
import { addresses } from "../libs/address/mod"

namespace owner {

  export function get(): textref {
    const found = storage.get(texts.fromString("owner"))

    if (!found)
      return texts.fromString("0000000000000000000000000000000000000000000000000000000000000000")

    return packs.get<textref>(found, 0)
  }

  export function set(address: textref): void {
    storage.set(texts.fromString("owner"), address)
  }

}

namespace balances {

  export function get(address: textref): bigintref {
    const found = storage.get(packs.create2(texts.fromString("balance"), address))

    if (!found)
      return bigints.zero()

    return packs.get<bigintref>(found, 0)
  }

  export function set(address: textref, value: bigintref): void {
    storage.set(packs.create2(texts.fromString("balance"), address), value)
  }

}

/**
 * Initialize the token with a specific owner
 * @param creator 
 * @returns nothing
 */
export function init(creator: textref): void {
  const module = blobs.toBase16(sha256.digest(blobs.encode(packs.create2(modules.load(modules.self()), packs.create1(creator)))))

  if (!texts.equals(modules.self(), module))
    throw new Error("Invalid")

  owner.set(creator)
}

/**
 * Get the balance of a specific address
 * @param target 
 * @returns i64
 */
export function balance(target: textref): bigintref {
  return balances.get(target)
}

/**
 * Use the owner session to mint tokens to a specific address
 * @param session 
 * @param target 
 * @param amount 
 */
export function mint(session: packref, target: textref, amount: bigintref): void {
  const caller = addresses.verify(session)

  if (!texts.equals(caller, owner.get()))
    throw new Error("Unauthorized")

  balances.set(target, bigints.add(balances.get(target), amount))

  storage.set(texts.fromString("mint"), packs.create2(target, amount))
}

/**
 * Use some session to transfer tokens to a specific address
 * @param session 
 * @param target 
 * @param amount 
 */
export function transfer(session: packref, target: textref, amount: bigintref): void {
  const caller = addresses.verify(session)

  const bsender = balances.get(caller)
  const btarget = balances.get(target)

  if (bigints.lt(bsender, amount)) // bsender < amount
    throw new Error("Insufficient balance")

  balances.set(caller, bigints.sub(bsender, amount))
  balances.set(target, bigints.add(btarget, amount))

  storage.set(texts.fromString("transfer"), packs.create3(caller, target, amount))
}