// deno-lint-ignore-file no-unused-vars

/// <reference types="../../../libs/bytes/lib.d.ts"/>

import { Readable, Writable } from "@hazae41/binary";
import process from "node:process";
import { generate } from "../../../libs/effort/mod.ts";
import { Packable, Packed } from "../../../libs/packed/mod.ts";

process.loadEnvFile(".env")

type Proof = [Array<string>, Array<[string, Uint8Array, Uint8Array]>, Array<[string, Uint8Array, Uint8Array]>, Packable, bigint]

async function execute<T extends Packable = Packable>(module: string, method: string, params: Array<Packable>) {
  const body = new FormData()

  body.append("module", module)
  body.append("method", method)
  body.append("params", new Blob([Writable.writeToBytesOrThrow(new Packed(params))]))
  body.append("effort", new Blob([await generate(2n ** 19n)]))

  const response = await fetch(new URL("/api/execute", process.env.SERVER), { method: "POST", body });

  if (!response.ok)
    throw new Error("Failed", { cause: response })

  const [logs, reads, writes, returned, sparks] = Readable.readFromBytesOrThrow(Packed, await response.bytes()) as Proof

  for (const log of logs)
    console.log(log)

  return returned as T
}

function parse(texts: string[]): Array<Packable> {
  const values = new Array<Packable>()

  for (const text of texts) {
    if (text === "null") {
      values.push(null)
      continue
    }

    if (text.startsWith("blob:")) {
      values.push(Uint8Array.fromHex(text.slice("blob:".length)))
      continue
    }

    if (text.startsWith("bigint:")) {
      values.push(BigInt(text.slice("bigint:".length)))
      continue
    }

    if (text.startsWith("number:")) {
      values.push(Number(text.slice("number:".length)))
      continue
    }

    if (text.startsWith("text:")) {
      values.push(text.slice("text:".length))
      continue
    }

    throw new Error("Unknown value type")
  }

  return values
}

function jsonify(value: Packable): unknown {
  if (value == null)
    return { type: "null" }

  if (value instanceof Uint8Array)
    return { type: "blob", value: value.toHex() }

  if (typeof value === "bigint")
    return { type: "bigint", value: value.toString() }

  if (typeof value === "number")
    return { type: "number", value: value.toString() }

  if (typeof value === "string")
    return { type: "text", value }

  if (Array.isArray(value)) {
    const entries = new Array<unknown>()

    for (const subvalue of value)
      entries.push(jsonify(subvalue))

    return { type: "array", value: entries }
  }

  throw new Error("Unknown value type")
}

const [ed25519, module, method, ...params] = process.argv.slice(2)

const sigkey0 = Uint8Array.fromHex("302e020100300506032b657004220420e722733dfaf093dbbdac198e8744faa91add842d5c3078fdcb6f6b070b862dd9")
const pubkey0 = Uint8Array.fromHex("302a300506032b65700321003307db3f4c10d841905907774ebb894e4cfb89f8a9754f5736288d70c2c593eb")

const address = new Uint8Array(await crypto.subtle.digest("SHA-256", Writable.writeToBytesOrThrow(new Packed([ed25519, pubkey0])))).subarray(12, 32).toHex()

console.log("address", address)

const nonce = await execute<bigint>(ed25519, "get_nonce", [address])

console.log("nonce", nonce)

const sigkey = await crypto.subtle.importKey("pkcs8", sigkey0, "Ed25519", true, ["sign"])

const message = Writable.writeToBytesOrThrow(new Packed(["17fa1cb5-c5af-4cfd-9bea-1a36590b890d", module, method, parse(params), nonce]))

const signature0 = new Uint8Array(await crypto.subtle.sign("Ed25519", sigkey, message))

console.log(jsonify(await execute(ed25519, "call", [module, method, parse(params), pubkey0, signature0])))