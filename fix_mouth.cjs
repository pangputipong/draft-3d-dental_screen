const fs = require('fs');

let jsx = fs.readFileSync('src/DiagnosticViewer.jsx', 'utf8');

const targetRegex = /useEffect\(\(\) => \{\s*if \(objectGroupRef\.current\) \{[\s\S]*?\}\s*\}, \[openMouth\]\);/;

const newContent = `useEffect(() => {
       if (objectGroupRef.current) {
          let lowerPivot = null;
          let upperPivot = null;
          objectGroupRef.current.traverse((child) => {
             if (child.name === 'lowerPivot') lowerPivot = child;
             if (child.name === 'upperPivot') upperPivot = child;
          });
          
          // 90 degrees total = 45 degrees each
          const maxAngle = Math.PI / 4;
          const angle = (openMouth / 100) * maxAngle;
          
          if (lowerPivot) {
             lowerPivot.rotation.x = angle;
          }
          
          if (upperPivot) {
             upperPivot.rotation.x = -angle;
          }
       }
    }, [openMouth]);`;

jsx = jsx.replace(targetRegex, newContent);
fs.writeFileSync('src/DiagnosticViewer.jsx', jsx);
console.log('Done openMouth logic!');
