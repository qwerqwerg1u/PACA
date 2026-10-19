
local Step = require("PACA.step")
local Ast = require("PACA.ast")
local Scope = require("PACA.scope")

local PACAWrapper = Step:extend()

PACAWrapper.Name = "PACA Wrapper"
PACAWrapper.Description = "Builds a bounded chain of scoped vararg closures."

PACAWrapper.SettingsDescriptor = {
    Iterations = {
        name = "Iterations",
        description = "Number of wrapper layers (1-5)",
        type = "number",
        default = 2,
        min = 1,
        max = 5,
    },
}

local MIN_LAYERS = 1
local MAX_LAYERS = 5
local DEFAULT_LAYERS = 2

local function normalizeIterations(value)
    local n = tonumber(value)

    if not n or n ~= n then
        return DEFAULT_LAYERS
    end

    n = math.floor(n)

    if n < MIN_LAYERS then
        return MIN_LAYERS
    end

    if n > MAX_LAYERS then
        return MAX_LAYERS
    end

    return n
end

function PACAWrapper:init(settings)
    self.Iterations = normalizeIterations(
        settings and settings.Iterations or self.Iterations
    )
end

local function validateBlock(block)
    assert(type(block) == "table", "PACA Wrapper: invalid AST block")
    assert(type(block.scope) == "table", "PACA Wrapper: block scope missing")
end

local function createLayer(innerBlock, parentScope)
    validateBlock(innerBlock)

    assert(
        type(parentScope) == "table",
        "PACA Wrapper: parent scope missing"
    )

    local layerScope = Scope:new(parentScope)
    innerBlock.scope:setParent(layerScope)

    local params = {
        Ast.VarargExpression(),
    }

    local args = {
        Ast.VarargExpression(),
    }

    local functionExpr = Ast.FunctionLiteralExpression(
        params,
        innerBlock
    )

    local callExpr = Ast.FunctionCallExpression(
        functionExpr,
        args
    )

    return Ast.Block({
        Ast.ReturnStatement({
            callExpr,
        }),
    }, layerScope)
end

function PACAWrapper:apply(ast)
    assert(type(ast) == "table", "PACA Wrapper: AST missing")
    assert(type(ast.body) == "table", "PACA Wrapper: AST body missing")
    assert(
        type(ast.globalScope) == "table",
        "PACA Wrapper: global scope missing"
    )

    local originalBody = ast.body
    validateBlock(originalBody)

    local candidate = originalBody
    local parentScope = ast.globalScope

    for _ = 1, normalizeIterations(self.Iterations) do
        candidate = createLayer(candidate, parentScope)
        parentScope = candidate.scope
    end

    ast.body = candidate

    return ast
end

return PACAWrapper
