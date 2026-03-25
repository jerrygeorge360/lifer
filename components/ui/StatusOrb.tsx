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
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
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
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const mainColor = status === "safe" ? new THREE.Color(0x00FF8C) : new THREE.Color(0xFF3B30);
    const secondaryColor = status === "safe" ? new THREE.Color(0x00A3FF) : new THREE.Color(0xFF9500);

    // Group for parallax movement
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Core Sphere (Glow)
    const geometry = new THREE.SphereGeometry(1.6, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color: mainColor,
      emissive: mainColor,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      thickness: 0.5,
    });
    const core = new THREE.Mesh(geometry, material);
    mainGroup.add(core);

    // 2. Wireframe Shell (Interactive)
    const shellGeometry = new THREE.SphereGeometry(1.9, 24, 24);
    const shellWireframe = new THREE.WireframeGeometry(shellGeometry);
    const shellMaterial = new THREE.LineBasicMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const shell = new THREE.LineSegments(shellWireframe, shellMaterial);
    mainGroup.add(shell);

    // 3. Floating Particles (Atmosphere)
    const particlesCount = 100;
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Uint32Array(particlesCount * 3);
    const pos = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 8;
    }
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: mainColor,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(mainColor, 5, 15);
    pointLight.position.set(2, 2, 4);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(secondaryColor, 3, 10);
    backLight.position.set(-2, -2, -2);
    scene.add(backLight);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.01;

      // Parallax effect
      mainGroup.rotation.y += (mouseRef.current.x * 0.2 - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (mouseRef.current.y * -0.2 - mainGroup.rotation.x) * 0.05;

      // Core pulsing
      const pulse = 1 + Math.sin(timeRef.current * 1.5) * 0.05;
      core.scale.set(pulse, pulse, pulse);
      material.emissiveIntensity = 0.5 + Math.sin(timeRef.current * 2) * 0.3;

      // Shell rotation
      shell.rotation.y += 0.003;
      shell.rotation.z += 0.001;

      // Particles drift
      particles.rotation.y += 0.0005;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handlers
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      scene.clear();
    };
  }, [status]);

  return (
    <div 
      ref={containerRef} 
      className={`canvas-container mx-auto h-64 w-64 ${className}`}
      style={{ 
        filter: "drop-shadow(0 0 30px rgba(0, 255, 140, 0.2))",
      }}
    />
  );
}
