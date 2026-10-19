local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local Scope = require("prometheus.scope")

local WrapInFunction = Step:extend()

WrapInFunction.Name = "Wrap in Function"
WrapInFunction.Description = "Wraps the script in bounded nested vararg closures"

WrapInFunction.SettingsDescriptor = {
    Iterations = {
        name = "Iterations",
        description = "Number of nested wrapper layers (1-5)",
        type = "number",
        default = 2,
        min = 1,
        max = 5,
    },
}

function WrapInFunction:init()
    local n = tonumber(self.Iterations) or 2
    n = math.floor(n)
    if n < 1 then n = 1 end
    if n > 5 then n = 5 end
    self.Iterations = n
end

local function makeWrapper(body, parentScope)
    assert(type(body) == "table", "Wrap in Function: expected AST body")
    assert(type(body.scope) == "table", "Wrap in Function: AST body has no scope")
    assert(type(parentScope) == "table", "Wrap in Function: missing parent scope")

    local wrapperScope = Scope:new(parentScope)
    body.scope:setParent(wrapperScope)

    local parameters = { Ast.VarargExpression() }
    local arguments = { Ast.VarargExpression() }
    local closure = Ast.FunctionLiteralExpression(parameters, body)
    local invocation = Ast.FunctionCallExpression(closure, arguments)

    return Ast.Block({ Ast.ReturnStatement({ invocation }) }, wrapperScope)
end

function WrapInFunction:apply(ast)
    assert(type(ast) == "table", "Wrap in Function: expected AST")
    assert(type(ast.body) == "table", "Wrap in Function: AST has no body")
    assert(type(ast.globalScope) == "table", "Wrap in Function: AST has no global scope")

    local body = ast.body
    local parentScope = ast.globalScope

    for _ = 1, self.Iterations do
        body = makeWrapper(body, parentScope)
        parentScope = body.scope
    end

    ast.body = body
    return ast
end

return WrapInFunction
