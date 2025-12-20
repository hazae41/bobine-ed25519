/// <reference types="../../libs/bytes/lib.d.ts"/>

import { Writable } from "@hazae41/binary";
import process from "node:process";
import { Packed } from "../../libs/packed/mod.ts";

process.loadEnvFile(".env.local")
process.loadEnvFile(".env")

const [ed25519] = process.argv.slice(2)

const pubkeyAsBytes = Uint8Array.fromHex(process.env.PUBKEY)

const encoded = Writable.writeToBytesOrThrow(new Packed([ed25519, pubkeyAsBytes]))
const address = new Uint8Array(await crypto.subtle.digest("SHA-256", encoded)).toHex()

console.log(address)