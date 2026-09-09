const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// Use regex to replace the entire blocks robustly
css = css.replace(/\.split-layout\s*\{[\s\S]*?\}/, `.split-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 16px;
  overflow-y: auto;
  padding-bottom: 20px;
}`);

css = css.replace(/\.split-top\s*\{[\s\S]*?\}/, `.split-top {
  flex-shrink: 0;
  height: 60vh;
  min-height: 500px;
  background-color: var(--surface-color);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}`);

css = css.replace(/\.split-bottom\s*\{[\s\S]*?\}/, `.split-bottom {
  flex-shrink: 0;
  min-height: 500px;
  background-color: var(--surface-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}`);

fs.writeFileSync('src/index.css', css);
console.log("CSS Updated successfully with regex!");
