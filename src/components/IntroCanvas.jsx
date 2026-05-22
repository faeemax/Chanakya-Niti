import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

const IntroCanvas = ({ onComplete }) => {
  const containerRef = useRef();
  const canvasRef = useRef();
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    if (isSkipped) return;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010118);
    scene.fog = new THREE.FogExp2(0x010118, 0.0002);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 40);

    const effectComposer = new EffectComposer(renderer);
    effectComposer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
    bloomPass.threshold = 0.05;
    bloomPass.strength = 0.9;
    bloomPass.radius = 0.8;
    effectComposer.addPass(bloomPass);
    const filmPass = new FilmPass(0.25, 0.5, 2048, false);
    filmPass.renderToScreen = true;
    effectComposer.addPass(filmPass);

    // Stars
    const starCount = 4000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < starCount; i++) {
        starPos.push((Math.random() - 0.5) * 500);
        starPos.push((Math.random() - 0.5) * 300);
        starPos.push((Math.random() - 0.5) * 200 - 80);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starPos), 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.6 }));
    scene.add(stars);

    // Sun
    const sunMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0xff4411, emissiveIntensity: 1.5 });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(2.6, 128, 128), sunMat);
    scene.add(sun);
    
    const sunLight = new THREE.PointLight(0xffaa66, 1.8, 60);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111122));

    const planets = [];
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 64), new THREE.MeshStandardMaterial({ color: 0x2233ff }));
    earth.position.set(10, 0, 0);
    scene.add(earth);
    planets.push({ mesh: earth, distance: 10, speed: 0.01, angle: 0 });

    let animId;
    let time = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.01;
      
      planets.forEach(p => {
        p.angle += p.speed;
        p.mesh.position.x = Math.cos(p.angle) * p.distance;
        p.mesh.position.z = Math.sin(p.angle) * p.distance;
      });

      stars.rotation.y += 0.0002;
      effectComposer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      effectComposer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSkipped]);

  const handleSkip = () => {
    setIsSkipped(true);
    setTimeout(onComplete, 500);
  };

  return (
    <AnimatePresence>
      {!isSkipped && (
        <motion.div 
          ref={containerRef}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 1, duration: 1.5 }}
               className="text-center"
             >
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-2">CHANAKYA</h1>
                <p className="text-xl md:text-2xl text-royal-primary font-bold tracking-[0.5em] uppercase">The Art of Power</p>
             </motion.div>
          </div>
          <button 
            onClick={handleSkip}
            className="absolute bottom-12 right-12 btn-primary px-8 py-4 text-sm tracking-widest"
          >
            SKIP INTRODUCTION
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroCanvas;
