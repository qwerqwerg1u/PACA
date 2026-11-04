import { lex, parseWithErrors, obfuscate, compile, generateVM } from "../web/src/generated/clyde/index.js"

const cases = [
  ["compound assignment, continue, and varargs", `local total = 0\nlocal function add(...)\n local values = {...}\n total += #values\nend\nfor i = 1, 8 do\n if i % 2 == 0 then\n  total -= i\n  continue\n end\n total += i\nend\nadd("a", "b", "c")\nprint(total)`],
  ["while, repeat, and generic iteration", `local items = {}\nrepeat\n items[#items + 1] = #items + 1\nuntil #items >= 3\nwhile #items > 0 do\n table.remove(items)\nend\nfor key, value in pairs({ name = "paca" }) do\n print(key, value)\nend`],
  ["type aliases and generics", `type Box<T> = { value: T }\nexport type User = { name: string, age: number }\nlocal function identity<T>(value: T): T\n return value\nend\nlocal item: Box<number> = { value = identity(5) }\nprint(item.value)`],
  ["if expressions and interpolation", 'local who = "PACA"\nlocal greeting = if who ~= "" then `hello {who}` else "hello"\nprint(greeting)'],
  ["type functions and exported types", `type function keyOf<T>(value: T): string\n return "value"\nend\nexport type Pair<T> = { first: T, second: T }`],
]

for (const [name, source] of cases) {
  const lexical = lex(source)
  if (lexical.errors.length) throw new Error(`${name}: lexer errors: ${lexical.errors.map((x) => x.message).join("; ")}`)
  const parsed = parseWithErrors(lexical.tokens)
  if (parsed.errors.length) throw new Error(`${name}: parser errors: ${parsed.errors.map((x) => x.message).join("; ")}`)
  try {
    compile(parsed.ast)
  } catch (error) {
    throw new Error(`${name}: VM compiler error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const source = `local total = 0\nfor i = 1, 3 do total += i end\nprint(total)`
const tokens = lex(source).tokens
const ast = parseWithErrors(tokens).ast
const transformed = obfuscate(ast, { renameLocals: true, preserveGlobals: true, seed: 12345 })
const bytecode = compile(transformed)
const output = generateVM(bytecode, {
  level: "max",
  executorGlobals: true,
  polymorphicSeed: 12345,
  forceSingleVM: true,
  _noWatermark: true,
  forceFeatures: ["antiTamper"],
})
if (!output.trim()) throw new Error("Clyde VM smoke test returned empty output")
if (!output.includes("~=")) throw new Error("VM code-hash integrity check was not generated")
if (output.includes("clydeprotectionde.cloud")) throw new Error("Upstream watermark was not suppressed")
const generatedLex = lex(output)
if (generatedLex.errors.length) throw new Error(`Generated VM lexer errors: ${generatedLex.errors.map((x) => x.message).join("; ")}`)
const generatedParse = parseWithErrors(generatedLex.tokens)
if (generatedParse.errors.length) throw new Error(`Generated VM parser errors: ${generatedParse.errors.map((x) => x.message).join("; ")}`)
console.log(`Clyde smoke test passed: ${cases.length} syntax cases + VM generation + generated-output parse (${output.length} chars).`)
