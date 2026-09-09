const fs = require('fs');

// 1. Fix CSS
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace('height: 400px; /* slightly taller for buttons */', 'height: 500px; /* much taller for odontogram */');
css = css.replace('align-items: center;', 'align-items: stretch;');
fs.writeFileSync('src/index.css', css);

// 2. Fix DiagnosticViewer.jsx (Camera size and Mouth opening)
let jsx = fs.readFileSync('src/DiagnosticViewer.jsx', 'utf8');

// Fix camera initial size
jsx = jsx.replace('cameraRef.current.position.set(0, -maxDim * 1.5, maxDim);', 'cameraRef.current.position.set(0, -maxDim * 0.8, maxDim * 0.8);');

// Fix camera view preset distance
jsx = jsx.replace('const distance = 150;', 'const distance = 80;');

// Fix jaw opening
const oldJawRegex = /\/\/ 90 degrees total = 45 degrees each[\s\S]*?upperJaw\.position\.z = -openMouth \* 0\.2;\s*\}/;
const newJaw = `// Realistic mouth opening (max 35 degrees)
        const maxAngle = Math.PI / 5;
        const angle = (openMouth / 100) * maxAngle;
        
        if (lowerJaw) {
           lowerJaw.rotation.x = angle;
           lowerJaw.position.y = -openMouth * 0.15;
           lowerJaw.position.z = -openMouth * 0.05;
        }
        
        if (upperJaw) {
           upperJaw.rotation.x = 0;
           upperJaw.position.y = 0;
           upperJaw.position.z = 0;
        }`;

if (oldJawRegex.test(jsx)) {
    jsx = jsx.replace(oldJawRegex, newJaw);
} else {
    console.log("Could not find old jaw regex!");
}

fs.writeFileSync('src/DiagnosticViewer.jsx', jsx);
console.log("Done updating!");
