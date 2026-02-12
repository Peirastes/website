-- hide-wip.lua
-- Removes work-in-progress sections from PDF output.
-- Add section IDs to the table below to hide them.

local hide = {
  -- e.g. ["part-vii-conservation-laws-and-constitutive-relations"] = true,
}

function Div(el)
  if hide[el.identifier] then
    return pandoc.RawBlock("latex", "\\stepcounter{section}")
  end
end
