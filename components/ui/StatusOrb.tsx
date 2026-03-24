"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface StatusOrbProps {
  status: "safe" | "alert";
  className?: string;
}

export function StatusOrb({ status, className = "" }: StatusOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Sphere geometry
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);

    // Inner glowing sphere
    const glowColor = status === "safe" ? 0x00FF8C : 0xC0392B;
    const material = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Outer wireframe shell
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.15,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);
    wireframeRef.current = wireframe;

    // Point light for glow effect
    const light = new THREE.PointLight(glowColor, 2, 10);
    light.position.set(0, 0, 0);
    scene.add(light);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Slow rotation
      if (meshRef.current && wireframeRef.current) {
        meshRef.current.rotation.y += 0.002;
        meshRef.current.rotation.x += 0.001;
        wireframeRef.current.rotation.y += 0.002;
        wireframeRef.current.rotation.x += 0.001;

        // Pulsing glow
        const scale = 1 + Math.sin(time) * 0.08;
        meshRef.current.scale.set(scale, scale, scale);
        
        const opacity = 0.3 + Math.sin(time) * 0.1;
        (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [status]);

  return (
    <div 
      ref={containerRef} 
      className={`canvas-container ${className}`}
    />
  );
}
