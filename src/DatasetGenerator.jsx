import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export default function DatasetGenerator({ onComplete }) {
  const [status, setStatus] = useState("พร้อมใช้งาน: คลิกเพื่อเลือกโฟลเดอร์เคสคนไข้");
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);

  // มุมกล้อง 4 มุมที่ต้องการ (Vectors)
  const ANGLES = {
    occlusal: { x: 0, y: 0, z: 1 }, 
    front: { x: 0, y: -1, z: 0 },
    left: { x: -1, y: 0, z: 0 },
    right: { x: 1, y: 0, z: 0 }
  };

  const fileInputRef = useRef(null);

  const handleZipSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    
    // --- NEW: Upload ZIP to Server for long-term storage ---
    setStatus("กำลังอัปโหลดไฟล์ ZIP ไปยังฐานข้อมูล...");
    let zip_url = null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const upRes = await fetch(`${apiUrl}/api/upload_zip`, {
        method: 'POST',
        body: formData
      });
      if (upRes.ok) {
        const upData = await upRes.json();
        zip_url = upData.url;
      }
    } catch (err) {
      console.error("Failed to upload zip", err);
    }
    
    setStatus("กำลังเข้าถึงไฟล์ Zip...");
    
    try {
      const zip = await JSZip.loadAsync(file);
      const files = {};
      
      // อ่านไฟล์ทั้งหมดใน Zip
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const lowerName = filename.toLowerCase();
          // Extract the actual filename without path
          const nameOnly = lowerName.split('/').pop();
          if (nameOnly.endsWith('.obj')) {
            files[nameOnly] = await zipEntry.async("string");
          } else if (nameOnly.endsWith('.mtl')) {
            files[nameOnly] = await zipEntry.async("string");
          } else if (nameOnly.endsWith('.png') || nameOnly.endsWith('.jpg')) {
            const blob = await zipEntry.async("blob");
            files[nameOnly] = URL.createObjectURL(blob);
          }
        }
      }

      const assetMap = {};
      for (const key in files) {
         if (files[key] && typeof files[key] === 'string' && files[key].startsWith('blob:')) {
            assetMap[key] = files[key];
         }
      }

      const outputZip = new JSZip(); // สำหรับแพ็กรูปกลับไปให้ถ้าต้องการดาวน์โหลด
      const parts = ['upper', 'lower'];
      const capturedData = { upper: { images: [] }, lower: { images: [] }, zip_url: zip_url, assetMap: assetMap };
      
      for (const part of parts) {
        setStatus(`กำลังประมวลผลขากรรไกร ${part}...`);
        
        // ค้นหาไฟล์ obj โดยใช้ .includes(part) แทน .endsWith เพื่อให้ยืดหยุ่นขึ้น
        const objKey = Object.keys(files).find(name => name.includes(part) && name.endsWith('.obj'));
        if (!objKey) {
          console.warn(`ไม่พบไฟล์ที่มีคำว่า ${part} และลงท้ายด้วย .obj ใน Zip`);
          continue;
        }
        
        const objData = files[objKey];
        
        // ค้นหาไฟล์ png โดยใช้ .includes(part) เช่นกัน
        const pngKey = Object.keys(files).find(name => name.includes(part) && (name.endsWith('.png') || name.endsWith('.jpg')));
        let textureUrl = null;
        if (pngKey) {
           textureUrl = files[pngKey];
        }

        const mtlKey = Object.keys(files).find(name => name.includes(part) && name.endsWith('.mtl'));
        const mtlData = mtlKey ? files[mtlKey] : null;

        capturedData[part].objData = objData;
        capturedData[part].textureUrl = textureUrl;
        capturedData[part].mtlData = mtlData;

        // --- 3D Capture Logic ---
        const width = 800;
        const height = 800;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); 
        
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, preserveDrawingBuffer: true, antialias: true });
        renderer.setSize(width, height);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(0, 10, 0);
        scene.add(dirLight);
        
        const manager = new THREE.LoadingManager();
        if (assetMap) {
          manager.setURLModifier((url) => {
            const nameOnly = url.split('/').pop().toLowerCase();
            if (assetMap[nameOnly]) {
              return assetMap[nameOnly];
            }
            return url;
          });
        }

        const objLoader = new OBJLoader(manager);
        let hasMaterials = false;
        
        if (mtlData) {
          const mtlLoader = new MTLLoader(manager);
          const materials = mtlLoader.parse(mtlData);
          materials.preload();
          
          for (const matName in materials.materials) {
             const mat = materials.materials[matName];
             const stdMat = new THREE.MeshBasicMaterial({
                color: mat.color,
                map: mat.map,
                side: THREE.DoubleSide,
                roughness: 0.6
             });
             materials.materials[matName] = stdMat;
          }
          
          objLoader.setMaterials(materials);
          hasMaterials = true;
        }

        const object = objLoader.parse(objData);
        
        if (!hasMaterials && textureUrl) {
           const textureLoader = new THREE.TextureLoader();
           await new Promise((resolve, reject) => {
             const texture = textureLoader.load(
               textureUrl, 
               () => {
                 texture.colorSpace = THREE.SRGBColorSpace;
                 resolve(texture);
               },
               undefined,
               (err) => reject(err)
             );
             object.traverse((child) => {
                 if (child.isMesh) {
                     child.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.6 });
                 }
             });
           });
        } else if (!hasMaterials) {
           object.traverse((child) => {
             if (child.isMesh) {
                child.material = new THREE.MeshBasicMaterial({ color: 0xefd1d1, side: THREE.DoubleSide });
             }
           });
        }
        
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        object.position.x -= center.x;
        object.position.y -= center.y;
        object.position.z -= center.z;
        scene.add(object);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        
        // 4 Global Views
        for (const [angleName, vector] of Object.entries(ANGLES)) {
          let cx = vector.x * cameraZ;
          let cy = vector.y * cameraZ;
          let cz = vector.z * cameraZ;
          
          if (angleName === 'occlusal') {
             cz = part === 'upper' ? -cameraZ : cameraZ; 
          }
          
          camera.position.set(cx, cy, cz);
          camera.lookAt(0, 0, 0);
          
          renderer.render(scene, camera);
          
          const dataUrl = canvasRef.current.toDataURL("image/png");
          capturedData[part].images.push({ name: `${part}_มุม_${angleName}`, url: dataUrl });
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          outputZip.file(`${part}_มุม_${angleName}.png`, base64Data, {base64: true});
        }
        
        // 5 Segment Views
        renderer.localClippingEnabled = true; 
        const zoomedCameraZ = part === 'upper' ? -(cameraZ / 2) : (cameraZ / 2);
        
        const SEGMENTS = {
          seg1_molar_R: { x: size.x * 0.4, y: size.y * 0.3, w: size.x * 0.35, h: size.y * 0.4 },
          seg2_premolar_R: { x: size.x * 0.35, y: -size.y * 0.05, w: size.x * 0.35, h: size.y * 0.35 },
          seg3_anterior: { x: 0, y: -size.y * 0.35, w: size.x * 0.7, h: size.y * 0.35 }, 
          seg4_premolar_L: { x: -size.x * 0.35, y: -size.y * 0.05, w: size.x * 0.35, h: size.y * 0.35 },
          seg5_molar_L: { x: -size.x * 0.4, y: size.y * 0.3, w: size.x * 0.35, h: size.y * 0.4 }
        };

        for (const [segName, pos] of Object.entries(SEGMENTS)) {
          const clipPlanes = [
            new THREE.Plane(new THREE.Vector3(1, 0, 0), -(pos.x - pos.w/2)),
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), pos.x + pos.w/2),  
            new THREE.Plane(new THREE.Vector3(0, 1, 0), -(pos.y - pos.h/2)),
            new THREE.Plane(new THREE.Vector3(0, -1, 0), pos.y + pos.h/2)   
          ];
          
          object.traverse((child) => {
             if (child.isMesh && child.material) {
                child.material.clippingPlanes = clipPlanes;
                child.material.needsUpdate = true;
             }
          });

          camera.position.set(pos.x, pos.y, zoomedCameraZ);
          camera.lookAt(pos.x, pos.y, 0);
          
          renderer.render(scene, camera);
          
          const dataUrl = canvasRef.current.toDataURL("image/png");
          capturedData[part].images.push({ name: `${part}_มุม_${segName}`, url: dataUrl });
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          outputZip.file(`${part}_มุม_${segName}.png`, base64Data, {base64: true});
        }
        
        renderer.localClippingEnabled = false;
        object.traverse((child) => {
           if (child.isMesh && child.material) {
              child.material.clippingPlanes = null;
           }
        });
        
        renderer.dispose();
      }
      
      setStatus("ประมวลผลเสร็จสิ้น กำลังสลับไปยังหน้าวิเคราะห์...");
      
      // เราสามารถสั่ง Save รูปที่แคปเก็บไว้ก็ได้ถ้าต้องการ
      // const content = await outputZip.generateAsync({type:"blob"});
      // saveAs(content, "IOS_2D_Dataset.zip");
      
      if (onComplete) {
        onComplete(capturedData);
      }
      
    } catch (error) {
      console.error(error);
      if (error.name === 'AbortError') {
        setStatus("ยกเลิกการเลือกโฟลเดอร์");
      } else {
        setStatus("เกิดข้อผิดพลาด: " + error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container apple-card">
      <div className="card-header">
        <h2>Dataset Studio</h2>
        <p>คลิกเพื่อเลือกโฟลเดอร์จากเครื่องสแกน ระบบจะอ่านไฟล์ .obj และแปลงเป็นภาพอัตโนมัติ</p>
      </div>
      <div className="generator-main">
        <input 
          type="file" 
          accept=".zip" 
          ref={fileInputRef} 
          onChange={handleZipSelect} 
          style={{ display: 'none' }} 
        />
        <div 
          className={`upload-dropzone ${isProcessing ? 'processing' : ''}`}
          onClick={isProcessing ? undefined : () => fileInputRef.current?.click()}
          style={{ cursor: isProcessing ? 'wait' : 'pointer' }}
        >
          <div className="dropzone-content">
            <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <h3>{isProcessing ? status : 'คลิกเพื่อเลือกไฟล์ Zip'}</h3>
            <p>ระบบจะค้นหาไฟล์ .obj และ .png เพื่อสร้างภาพ 2D อัตโนมัติ</p>
          </div>
        </div>
      </div>
      
      <div className="status-text">{status}</div>
      
      {/* Canvas ซ่อนไว้สำหรับเรนเดอร์เบื้องหลัง */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}


