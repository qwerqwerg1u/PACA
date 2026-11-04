local total = 0

for _, value in pairs({ 1, 2, 3, 4, 5, 6 }) do
    if value % 2 == 0 then
        continue
    end
    total += value
end

local function getResult()
    return {
        Total = total,
        Label = "Luau parser smoke test",
    }
end

print(getResult().Total)
