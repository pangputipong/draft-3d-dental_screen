const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// Replace the entire .split-layout block
const oldCss = `.split-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.split-top {
  flex: 1;
  background-color: var(--surface-color);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

.split-bottom {
  flex-shrink: 0;
  height: 500px; /* much taller for odontogram */
  background-color: var(--surface-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}`;

const newCss = `.split-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 16px;
  overflow-y: auto; /* Allow scrolling */
  padding-bottom: 20px;
}

.split-top {
  flex-shrink: 0;
  height: 60vh; /* Takes up 60% of viewport height! Big and clear! */
  min-height: 500px;
  background-color: var(--surface-color);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

.split-bottom {
  flex-shrink: 0;
  height: 500px;
  background-color: var(--surface-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}`;

css = css.replace(oldCss, newCss);
fs.writeFileSync('src/index.css', css);
console.log("CSS Updated!");
