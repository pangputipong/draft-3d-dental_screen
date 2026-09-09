const fs = require("fs");
let code = fs.readFileSync("src/DiagnosticViewer.jsx", "utf8");

const regex = /      setTimeout\(\(\) => \{\s+const archesToProcess[\s\S]*?let targetZ = radius \* 0\.8;/;

const correctCode = `      setTimeout(() => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }, 50);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (viewMode !== '3d' || !sharedData || showReport) return;
    
    objectGroupRef.current.clear();

    const loadArch = (archName) => {
      const data = sharedData[archName];
      if (!data || !data.objData) return null;

      const manager = new THREE.LoadingManager();
      if (sharedData && sharedData.assetMap) {
        manager.setURLModifier((url) => {
          const nameOnly = url.split('/').pop().toLowerCase();
          if (sharedData.assetMap[nameOnly]) return sharedData.assetMap[nameOnly];
          return url;
        });
      }

      const objLoader = new OBJLoader(manager);
      let hasMaterials = false;
      
      if (data.mtlData) {
        const mtlLoader = new MTLLoader(manager);
        const materials = mtlLoader.parse(data.mtlData);
        materials.preload();
        for (const matName in materials.materials) {
           const mat = materials.materials[matName];
           materials.materials[matName] = new THREE.MeshBasicMaterial({
              color: mat.color,
              map: mat.map,
              side: THREE.DoubleSide
           });
        }
        objLoader.setMaterials(materials);
        hasMaterials = true;
      }

      const object = objLoader.parse(data.objData);

      if (!hasMaterials && data.textureUrl) {
        const texLoader = new THREE.TextureLoader();
        texLoader.load(data.textureUrl, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          object.traverse((child) => {
              if (child.isMesh) {
                  child.material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
              }
          });
        });
      } else if (!hasMaterials) {
        object.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
          }
        });
      }
      return object;
    };

    const combinedGroup = new THREE.Group();
    const upperObj = loadArch('upper');
    const lowerObj = loadArch('lower');
    
    if (upperObj) {
       upperObj.name = 'upperJaw';
       combinedGroup.add(upperObj);
    }
    if (lowerObj) {
       lowerObj.name = 'lowerJaw';
       combinedGroup.add(lowerObj);
    }

    const box = new THREE.Box3().setFromObject(combinedGroup);
    const center = box.getCenter(new THREE.Vector3());
    combinedGroup.position.sub(center);
    
    // Toggle visibility based on displayMode
    if (upperObj) upperObj.visible = displayMode === 'both' || displayMode === 'upper';
    if (lowerObj) lowerObj.visible = displayMode === 'both' || displayMode === 'lower';
    
    objectGroupRef.current.add(combinedGroup);

    if (cameraRef.current && controlsRef.current) {
       const size = box.getSize(new THREE.Vector3());
       const maxDim = Math.max(size.x, size.y, size.z);
       cameraRef.current.position.set(0, -maxDim * 1.5, maxDim);
       controlsRef.current.target.set(0, 0, 0);
       controlsRef.current.update();
    }
  }, [sharedData, viewMode, showReport, displayMode]);

  useEffect(() => {
     if (objectGroupRef.current) {
        objectGroupRef.current.traverse((child) => {
           if (child.name === 'lowerJaw') {
              child.position.y = -openMouth * 0.3; 
           }
        });
     }
  }, [openMouth]);

  useEffect(() => {
    if (!selectedTooth || !cameraRef.current || !controlsRef.current) return;
    
    const q = Math.floor(selectedTooth / 10);
    const camera = cameraRef.current;
    const radius = Math.sqrt(camera.position.x**2 + camera.position.y**2 + camera.position.z**2) || 100;
    
    let targetX = 0;
    let targetZ = radius * 0.8;`;

if (regex.test(code)) {
    code = code.replace(regex, correctCode);
    fs.writeFileSync("src/DiagnosticViewer.jsx", code);
    console.log("Restored effectively");
} else {
    console.log("Could not find boundaries");
}
