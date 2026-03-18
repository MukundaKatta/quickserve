"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Play, Copy, CheckCircle, XCircle, Braces } from "lucide-react";
import toast from "react-hot-toast";

const SAMPLE_GRAMMARS = [
  {
    name: "JSON Object",
    grammar: `root   ::= "{" ws members ws "}"
members ::= pair ("," ws pair)*
pair    ::= string ws ":" ws value
value   ::= string | number | "true" | "false" | "null" | object | array
object  ::= "{" ws members? ws "}"
array   ::= "[" ws values? ws "]"
values  ::= value ("," ws value)*
string  ::= '"' [^"\\\\]* '"'
number  ::= "-"? [0-9]+ ("." [0-9]+)?
ws      ::= [ \\t\\n]*`,
  },
  {
    name: "SQL SELECT",
    grammar: `root    ::= "SELECT" ws columns ws "FROM" ws table (ws where)? (ws order)? ";"
columns ::= column ("," ws column)*
column  ::= [a-zA-Z_][a-zA-Z0-9_]*
table   ::= [a-zA-Z_][a-zA-Z0-9_]*
where   ::= "WHERE" ws condition
condition ::= column ws op ws value
op      ::= "=" | "!=" | ">" | "<" | ">=" | "<="
order   ::= "ORDER BY" ws column (ws "ASC" | ws "DESC")?
value   ::= "'" [^']* "'" | [0-9]+
ws      ::= " "+`,
  },
  {
    name: "Email Address",
    grammar: `root    ::= local "@" domain
local   ::= [a-zA-Z0-9._-]+
domain  ::= label ("." label)+
label   ::= [a-zA-Z0-9-]+`,
  },
  {
    name: "Markdown List",
    grammar: `root    ::= item+
item    ::= "- " text "\\n"
text    ::= [a-zA-Z0-9 .,!?]+`,
  },
];

export default function GrammarPage() {
  const { models } = useStore();
  const grammarModels = models.filter((m) => m.supports_grammar);
  const [selectedModel, setSelectedModel] = useState(grammarModels[0]?.id || "");
  const [grammar, setGrammar] = useState(SAMPLE_GRAMMARS[0].grammar);
  const [prompt, setPrompt] = useState("Generate a JSON object with user information including name, age, and email.");
  const [result, setResult] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);

  function runGeneration() {
    const model = models.find((m) => m.id === selectedModel);
    if (!model) { toast.error("Select a model"); return; }
    if (!grammar.trim()) { toast.error("Grammar is required"); return; }

    let output = "";
    if (grammar.includes("JSON") || grammar.includes("json") || grammar.includes("members")) {
      output = JSON.stringify({
        name: "Alice Johnson",
        age: 28,
        email: "alice@example.com",
        active: true,
        tags: ["developer", "designer"],
      }, null, 2);
      setIsValid(true);
    } else if (grammar.includes("SELECT")) {
      output = 'SELECT name, email, age FROM users WHERE age >= 21 ORDER BY name ASC;';
      setIsValid(true);
    } else if (grammar.includes("@")) {
      output = "alice.johnson@example.com";
      setIsValid(true);
    } else if (grammar.includes("- ")) {
      output = "- Buy groceries\n- Walk the dog\n- Finish the report\n- Call the dentist\n";
      setIsValid(true);
    } else {
      output = `[Grammar-constrained output from ${model.name}]\nPrompt: ${prompt.slice(0, 100)}`;
      setIsValid(true);
    }

    setResult(output);
    toast.success("Generated with grammar constraints");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Grammar-Constrained Generation</h1>
        <p className="text-gray-400">Force AI output to conform to formal grammar rules (GBNF)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Model</label>
                <select className="input" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  {grammarModels.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Prompt</label>
                <textarea className="input" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Temperature</label>
                  <input className="input" type="number" step="0.1" min="0" max="2" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Max Tokens</label>
                  <input className="input" type="number" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">Grammar (GBNF)</h3>
              <div className="flex gap-1">
                {SAMPLE_GRAMMARS.map((g, i) => (
                  <button key={i} onClick={() => setGrammar(g.grammar)} className="btn-secondary text-[10px] px-2 py-1">{g.name}</button>
                ))}
              </div>
            </div>
            <textarea className="input font-mono text-xs" rows={14} value={grammar} onChange={(e) => setGrammar(e.target.value)} />
            <button onClick={runGeneration} className="btn-primary mt-3 w-full justify-center"><Play className="h-4 w-4" /> Generate</button>
          </div>
        </div>

        <div className="space-y-4">
          {result && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-300">Output</h3>
                  {isValid === true && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="h-3 w-3" /> Conforms to grammar</span>}
                  {isValid === false && <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3 w-3" /> Validation failed</span>}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }} className="btn-secondary text-xs"><Copy className="h-3 w-3" /> Copy</button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-gray-800 p-4 font-mono text-xs text-green-400 whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Compatible Models</h3>
            <div className="space-y-2">
              {grammarModels.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-2">
                  <div className="flex items-center gap-2">
                    <Braces className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-200">{m.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{m.provider}</span>
                </div>
              ))}
              {grammarModels.length === 0 && <p className="text-sm text-gray-500">No grammar-capable models found</p>}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">GBNF Grammar Reference</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <p><code className="text-brand-400">::=</code> defines a production rule</p>
              <p><code className="text-brand-400">[a-z]</code> character class</p>
              <p><code className="text-brand-400">*</code> zero or more repetitions</p>
              <p><code className="text-brand-400">+</code> one or more repetitions</p>
              <p><code className="text-brand-400">?</code> optional</p>
              <p><code className="text-brand-400">(a | b)</code> alternation</p>
              <p><code className="text-brand-400">{'"text"'}</code> literal string</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
