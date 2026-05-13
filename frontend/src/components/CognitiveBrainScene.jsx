import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import './CognitiveBrainScene.css';

const REGIONS = [
  {
    id: 'sensory_cortex',
    label: 'Sensory Cortex',
    shortLabel: 'Sensory',
    color: '#4d9fff',
    position: [-2.3, 0.95, 0.9],
    scale: [1.25, 0.78, 0.92],
    description: 'Receives the raw language signal and begins perceptual parsing.',
    phases: ['perception'],
  },
  {
    id: 'thalamus',
    label: 'Thalamus',
    shortLabel: 'Thalamus',
    color: '#18b8a6',
    position: [0.0, 0.1, 0.55],
    scale: [0.7, 0.62, 0.72],
    description: 'Scores salience, routes signals, and suppresses low-priority recalls.',
    phases: ['attention', 'routing', 'inhibition'],
  },
  {
    id: 'amygdala',
    label: 'Amygdala',
    shortLabel: 'Amygdala',
    color: '#ef5a55',
    position: [-0.85, -0.88, 0.7],
    scale: [0.48, 0.38, 0.46],
    description: 'Flags emotional intensity and urgency in the incoming message.',
    phases: ['emotion'],
  },
  {
    id: 'hippocampus',
    label: 'Hippocampus',
    shortLabel: 'Hippocampus',
    color: '#2fca84',
    position: [0.78, -0.95, 0.58],
    scale: [0.82, 0.33, 0.48],
    description: 'Retrieves relevant conversational and vector memories.',
    phases: ['working_memory', 'recall'],
  },
  {
    id: 'prefrontal_cortex',
    label: 'Prefrontal Cortex',
    shortLabel: 'Prefrontal',
    color: '#9a67ff',
    position: [2.1, 0.95, 0.82],
    scale: [1.22, 0.88, 0.95],
    description: 'Builds intent, predicts needs, and plans the response strategy.',
    phases: ['prediction', 'reflection', 'reasoning'],
  },
  {
    id: 'language_cortex',
    label: 'Language Cortex',
    shortLabel: 'Language',
    color: '#ff5f9a',
    position: [2.25, -0.25, 0.75],
    scale: [0.96, 0.6, 0.8],
    description: 'Converts the response plan into natural language output.',
    phases: ['language'],
  },
];

const DEFAULT_REGION_ID = 'prefrontal_cortex';
const DEFAULT_PHASE = 'idle';

const PHASE_MOODS = {
  idle: {
    accent: '#86dbff',
    glow: 'rgba(77, 159, 255, 0.18)',
    glowSecondary: 'rgba(255, 95, 154, 0.16)',
    glowTertiary: 'rgba(31, 211, 180, 0.16)',
    backgroundStart: '#050d16',
    backgroundMid: '#08121e',
    backgroundEnd: '#071522',
    fog: '#07111d',
    keyLight: '#8cc8ff',
    rimLight: '#ff7fc0',
    floorLight: '#1fd3b4',
    particle: '#90bbff',
  },
  perception: {
    accent: '#76b8ff',
    glow: 'rgba(118, 184, 255, 0.24)',
    glowSecondary: 'rgba(116, 203, 255, 0.12)',
    glowTertiary: 'rgba(29, 109, 255, 0.14)',
    backgroundStart: '#06101d',
    backgroundMid: '#0a1a30',
    backgroundEnd: '#081a2a',
    fog: '#081826',
    keyLight: '#84beff',
    rimLight: '#50b7ff',
    floorLight: '#1b82ff',
    particle: '#94c8ff',
  },
  attention: {
    accent: '#5fe8d5',
    glow: 'rgba(28, 214, 184, 0.24)',
    glowSecondary: 'rgba(89, 231, 201, 0.14)',
    glowTertiary: 'rgba(92, 167, 255, 0.12)',
    backgroundStart: '#061115',
    backgroundMid: '#0a1e25',
    backgroundEnd: '#081922',
    fog: '#09171d',
    keyLight: '#57e2d0',
    rimLight: '#8dc8ff',
    floorLight: '#17b89d',
    particle: '#80f2e0',
  },
  routing: {
    accent: '#79f2b7',
    glow: 'rgba(70, 227, 154, 0.22)',
    glowSecondary: 'rgba(27, 208, 255, 0.12)',
    glowTertiary: 'rgba(125, 220, 255, 0.14)',
    backgroundStart: '#07140f',
    backgroundMid: '#0b211a',
    backgroundEnd: '#081a16',
    fog: '#0a1713',
    keyLight: '#76f2b8',
    rimLight: '#4ec6ff',
    floorLight: '#24df84',
    particle: '#8ff0c6',
  },
  emotion: {
    accent: '#ff8f8a',
    glow: 'rgba(239, 90, 85, 0.28)',
    glowSecondary: 'rgba(255, 149, 94, 0.18)',
    glowTertiary: 'rgba(255, 110, 154, 0.18)',
    backgroundStart: '#16070b',
    backgroundMid: '#251018',
    backgroundEnd: '#1c0a13',
    fog: '#180b10',
    keyLight: '#ff8f8a',
    rimLight: '#ff6d8f',
    floorLight: '#ff9a5e',
    particle: '#ffb0a9',
  },
  prediction: {
    accent: '#b896ff',
    glow: 'rgba(154, 103, 255, 0.25)',
    glowSecondary: 'rgba(120, 170, 255, 0.14)',
    glowTertiary: 'rgba(205, 142, 255, 0.14)',
    backgroundStart: '#0d0819',
    backgroundMid: '#181028',
    backgroundEnd: '#110a1e',
    fog: '#110c1a',
    keyLight: '#b896ff',
    rimLight: '#7ca9ff',
    floorLight: '#c982ff',
    particle: '#ccb1ff',
  },
  working_memory: {
    accent: '#a5bcc9',
    glow: 'rgba(148, 170, 184, 0.22)',
    glowSecondary: 'rgba(126, 149, 167, 0.12)',
    glowTertiary: 'rgba(83, 194, 255, 0.12)',
    backgroundStart: '#0b1015',
    backgroundMid: '#121a21',
    backgroundEnd: '#0d141b',
    fog: '#0d141a',
    keyLight: '#aec4d2',
    rimLight: '#6ca4d8',
    floorLight: '#8aa0ad',
    particle: '#bfd4df',
  },
  recall: {
    accent: '#63dd9b',
    glow: 'rgba(47, 202, 132, 0.24)',
    glowSecondary: 'rgba(104, 237, 186, 0.14)',
    glowTertiary: 'rgba(89, 220, 255, 0.12)',
    backgroundStart: '#07130f',
    backgroundMid: '#0d2219',
    backgroundEnd: '#0a1814',
    fog: '#0b1712',
    keyLight: '#63dd9b',
    rimLight: '#76e9cf',
    floorLight: '#1fd3b4',
    particle: '#86efbc',
  },
  inhibition: {
    accent: '#ffb46e',
    glow: 'rgba(249, 115, 22, 0.24)',
    glowSecondary: 'rgba(255, 180, 110, 0.16)',
    glowTertiary: 'rgba(255, 223, 129, 0.12)',
    backgroundStart: '#161009',
    backgroundMid: '#26170d',
    backgroundEnd: '#1d120b',
    fog: '#17110c',
    keyLight: '#ffb46e',
    rimLight: '#ffd579',
    floorLight: '#ff8f4d',
    particle: '#ffd09d',
  },
  reflection: {
    accent: '#c28dff',
    glow: 'rgba(168, 85, 247, 0.24)',
    glowSecondary: 'rgba(194, 141, 255, 0.16)',
    glowTertiary: 'rgba(119, 182, 255, 0.12)',
    backgroundStart: '#10081a',
    backgroundMid: '#1b0f2d',
    backgroundEnd: '#120a1f',
    fog: '#130b1c',
    keyLight: '#c28dff',
    rimLight: '#9f7dff',
    floorLight: '#d77bff',
    particle: '#d8b6ff',
  },
  association: {
    accent: '#ffce72',
    glow: 'rgba(245, 158, 11, 0.24)',
    glowSecondary: 'rgba(255, 205, 119, 0.16)',
    glowTertiary: 'rgba(255, 158, 84, 0.12)',
    backgroundStart: '#171108',
    backgroundMid: '#2a1a0b',
    backgroundEnd: '#1d130a',
    fog: '#18120b',
    keyLight: '#ffce72',
    rimLight: '#ffb84f',
    floorLight: '#f59e0b',
    particle: '#ffe2a2',
  },
  reasoning: {
    accent: '#ff93d5',
    glow: 'rgba(236, 72, 153, 0.24)',
    glowSecondary: 'rgba(255, 147, 213, 0.16)',
    glowTertiary: 'rgba(154, 103, 255, 0.14)',
    backgroundStart: '#180a14',
    backgroundMid: '#291120',
    backgroundEnd: '#1c0b16',
    fog: '#170c14',
    keyLight: '#ff93d5',
    rimLight: '#bb90ff',
    floorLight: '#ff5ea3',
    particle: '#ffb5e3',
  },
  language: {
    accent: '#ff91b7',
    glow: 'rgba(255, 95, 154, 0.24)',
    glowSecondary: 'rgba(255, 145, 183, 0.16)',
    glowTertiary: 'rgba(255, 204, 116, 0.12)',
    backgroundStart: '#180a13',
    backgroundMid: '#2b1320',
    backgroundEnd: '#1d0d16',
    fog: '#170c14',
    keyLight: '#ff91b7',
    rimLight: '#ffcb74',
    floorLight: '#ff5f9a',
    particle: '#ffbfd3',
  },
  memory: {
    accent: '#aab7c6',
    glow: 'rgba(148, 163, 184, 0.24)',
    glowSecondary: 'rgba(122, 140, 160, 0.16)',
    glowTertiary: 'rgba(47, 202, 132, 0.12)',
    backgroundStart: '#0c1016',
    backgroundMid: '#161c24',
    backgroundEnd: '#0d1218',
    fog: '#0d1318',
    keyLight: '#b8c5d4',
    rimLight: '#75d5a2',
    floorLight: '#8fa0b5',
    particle: '#d2dbe5',
  },
  graph: {
    accent: '#7ceaff',
    glow: 'rgba(6, 182, 212, 0.24)',
    glowSecondary: 'rgba(124, 234, 255, 0.16)',
    glowTertiary: 'rgba(77, 159, 255, 0.14)',
    backgroundStart: '#071116',
    backgroundMid: '#0b1d25',
    backgroundEnd: '#08161d',
    fog: '#09141a',
    keyLight: '#7ceaff',
    rimLight: '#75a5ff',
    floorLight: '#06b6d4',
    particle: '#a8f2ff',
  },
};

function makePulseMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.22,
    metalness: 0.08,
    transmission: 0.02,
    transparent: true,
    opacity: 0.9,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.24,
  });
}

function findLatestRegionEvent(brainEvents, regionId) {
  for (let index = brainEvents.length - 1; index >= 0; index -= 1) {
    if (brainEvents[index].region === regionId) return brainEvents[index];
  }
  return null;
}

function getActiveEvent(brainEvents) {
  return brainEvents.length ? brainEvents[brainEvents.length - 1] : null;
}

function buildTimeline(brainEvents) {
  return [...brainEvents].slice(-7).reverse();
}

function getPhaseMood(phase) {
  return PHASE_MOODS[phase || DEFAULT_PHASE] || PHASE_MOODS[DEFAULT_PHASE];
}

function formatPhaseLabel(phase) {
  return (phase || 'idle').replace(/_/g, ' ');
}

function formatRegionLabel(regionId) {
  return REGIONS.find((region) => region.id === regionId)?.label || regionId.replace(/_/g, ' ');
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unavailable';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getSelectedRegion(regions, selectedRegionId) {
  return regions.find((region) => region.id === selectedRegionId) || regions.find((region) => region.id === DEFAULT_REGION_ID);
}

function createBrainShellMaterial(color, opacity = 0.12) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.3,
    metalness: 0,
    transparent: true,
    opacity,
    transmission: 0.55,
    thickness: 0.8,
    emissive: new THREE.Color('#4d9fff'),
    emissiveIntensity: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    side: THREE.DoubleSide,
  });
}

function buildHemisphere(side) {
  const group = new THREE.Group();
  const shellColor = side === 'left' ? '#d5e4ff' : '#dbe8ff';
  const lateralShift = side === 'left' ? -1 : 1;
  const shellMaterial = createBrainShellMaterial(shellColor, 0.11);
  const lobeDefinitions = [
    { position: [1.35 * lateralShift, 0.52, 0.08], scale: [1.26, 0.95, 0.98] },
    { position: [0.7 * lateralShift, 1.06, 0.12], scale: [0.9, 0.78, 0.82] },
    { position: [0.9 * lateralShift, -0.18, 0.18], scale: [1.02, 0.8, 0.9] },
    { position: [1.62 * lateralShift, 0.15, -0.32], scale: [0.7, 0.66, 0.7] },
  ];

  lobeDefinitions.forEach((lobe) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 44, 44), shellMaterial.clone());
    mesh.position.set(...lobe.position);
    mesh.scale.set(...lobe.scale);
    group.add(mesh);
  });

  const grooveMaterial = new THREE.MeshBasicMaterial({
    color: side === 'left' ? '#c7dfff' : '#dbe9ff',
    transparent: true,
    opacity: 0.16,
  });
  const grooveArcs = [
    [
      new THREE.Vector3(2.0 * lateralShift, 1.25, 0.3),
      new THREE.Vector3(1.4 * lateralShift, 0.72, 0.82),
      new THREE.Vector3(1.15 * lateralShift, 0.05, 0.98),
      new THREE.Vector3(1.58 * lateralShift, -0.66, 0.58),
    ],
    [
      new THREE.Vector3(1.52 * lateralShift, 1.45, -0.22),
      new THREE.Vector3(0.95 * lateralShift, 0.85, 0.15),
      new THREE.Vector3(0.82 * lateralShift, 0.1, 0.38),
      new THREE.Vector3(1.26 * lateralShift, -0.72, 0.08),
    ],
    [
      new THREE.Vector3(0.76 * lateralShift, 1.28, 0.22),
      new THREE.Vector3(0.42 * lateralShift, 0.64, 0.52),
      new THREE.Vector3(0.35 * lateralShift, -0.1, 0.4),
      new THREE.Vector3(0.68 * lateralShift, -0.74, 0.12),
    ],
  ];

  grooveArcs.forEach((points) => {
    const curve = new THREE.CatmullRomCurve3(points);
    const groove = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 0.03, 10, false), grooveMaterial.clone());
    group.add(groove);
  });

  return group;
}

function makeSignalPulse(color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 18, 18),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
    })
  );
}

function CognitiveBrainScene({ brainState }) {
  const mountRef = useRef(null);
  const connectorsRef = useRef([]);
  const hoveredIdRef = useRef(null);
  const selectedIdRef = useRef(DEFAULT_REGION_ID);
  const activeEventRef = useRef(null);
  const labelRefs = useRef(new Map());

  const [hoveredRegionId, setHoveredRegionId] = useState(null);
  const [selectedRegionId, setSelectedRegionId] = useState(DEFAULT_REGION_ID);

  const brainEvents = brainState.brainEvents || [];
  const activeEvent = getActiveEvent(brainEvents);
  const currentMood = useMemo(() => getPhaseMood(activeEvent?.phase), [activeEvent?.phase]);
  const selectedRegion = useMemo(() => getSelectedRegion(REGIONS, selectedRegionId), [selectedRegionId]);
  const selectedEvent = useMemo(() => findLatestRegionEvent(brainEvents, selectedRegion.id), [brainEvents, selectedRegion.id]);
  const timeline = useMemo(() => buildTimeline(brainEvents), [brainEvents]);
  const selectedInputs = selectedEvent?.inputs_used || [];
  const selectedTargets = (selectedEvent?.next_regions || []).map(formatRegionLabel);
  const selectedDataEntries = Object.entries(selectedEvent?.data || {}).slice(0, 4);

  useEffect(() => {
    selectedIdRef.current = selectedRegionId;
  }, [selectedRegionId]);

  useEffect(() => {
    activeEventRef.current = activeEvent;
    if (activeEvent?.region) {
      setSelectedRegionId(activeEvent.region);
    }
  }, [activeEvent]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07111d');
    scene.fog = new THREE.Fog('#07111d', 8, 18);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.65, 11.5);
    camera.lookAt(0.2, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#ffffff', 1.2);
    const keyLight = new THREE.PointLight('#8cc8ff', 18, 30, 2);
    keyLight.position.set(5.5, 4.5, 6);
    const rimLight = new THREE.PointLight('#ff7fc0', 9, 24, 2);
    rimLight.position.set(-6.2, -2.8, 5);
    const floorLight = new THREE.PointLight('#1fd3b4', 7, 22, 2);
    floorLight.position.set(0, -5, 7);

    scene.add(ambientLight, keyLight, rimLight, floorLight);

    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    const leftHemisphere = buildHemisphere('left');
    const rightHemisphere = buildHemisphere('right');
    brainGroup.add(leftHemisphere, rightHemisphere);

    const bridge = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 1.4, 10, 20),
      new THREE.MeshPhysicalMaterial({
        color: '#9ec7ff',
        roughness: 0.35,
        metalness: 0.04,
        transparent: true,
        opacity: 0.1,
        emissive: new THREE.Color('#1fd3b4'),
        emissiveIntensity: 0.04,
      })
    );
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, -0.15, 0.05);
    brainGroup.add(bridge);

    const cerebellum = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 34, 34),
      new THREE.MeshPhysicalMaterial({
        color: '#b8d0ff',
        roughness: 0.36,
        metalness: 0.02,
        transparent: true,
        opacity: 0.14,
        emissive: new THREE.Color('#6aa8ff'),
        emissiveIntensity: 0.05,
      })
    );
    cerebellum.position.set(0.05, -1.62, -0.78);
    cerebellum.scale.set(1.55, 0.72, 0.85);
    brainGroup.add(cerebellum);

    const brainStem = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 1.18, 8, 16),
      new THREE.MeshPhysicalMaterial({
        color: '#9bc4ff',
        roughness: 0.28,
        metalness: 0.03,
        transparent: true,
        opacity: 0.16,
        emissive: new THREE.Color('#28d3c8'),
        emissiveIntensity: 0.06,
      })
    );
    brainStem.position.set(0, -2.0, -0.1);
    brainStem.rotation.x = -0.18;
    brainGroup.add(brainStem);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.1 + Math.random() * 2.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: '#90bbff',
      size: 0.035,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particles);

    const regionMeshes = new Map();
    REGIONS.forEach((region) => {
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 6), makePulseMaterial(region.color));
      mesh.scale.set(...region.scale);
      mesh.position.set(...region.position);
      mesh.userData.regionId = region.id;
      mesh.userData.baseScale = region.scale;
      mesh.userData.baseColor = region.color;

      const outline = new THREE.Mesh(
        new THREE.SphereGeometry(1.03, 28, 28),
        new THREE.MeshBasicMaterial({
          color: region.color,
          transparent: true,
          opacity: 0.12,
          side: THREE.BackSide,
        })
      );
      mesh.add(outline);
      brainGroup.add(mesh);
      regionMeshes.set(region.id, mesh);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function clearConnectors() {
      connectorsRef.current.forEach((connector) => {
        scene.remove(connector.tube);
        connector.tube.geometry.dispose();
        connector.tube.material.dispose();
        connector.pulses.forEach((pulse) => {
          scene.remove(pulse);
          pulse.geometry.dispose();
          pulse.material.dispose();
        });
      });
      connectorsRef.current = [];
    }

    function rebuildConnectors(event) {
      clearConnectors();
      if (!event?.region || !event.next_regions?.length) return;
      const sourceMesh = regionMeshes.get(event.region);
      if (!sourceMesh) return;

      event.next_regions.forEach((nextRegionId) => {
        const targetMesh = regionMeshes.get(nextRegionId);
        if (!targetMesh) return;

        const points = [
          sourceMesh.position.clone(),
          sourceMesh.position.clone().lerp(targetMesh.position, 0.5).add(new THREE.Vector3(0, 0.65, 0.35)),
          targetMesh.position.clone(),
        ];
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 24, 0.035, 10, false);
        const material = new THREE.MeshBasicMaterial({
          color: '#c8e4ff',
          transparent: true,
          opacity: 0.48,
        });
        const tube = new THREE.Mesh(geometry, material);
        scene.add(tube);
        const pulseColor = '#9fd9ff';
        const pulses = [0, 0.32, 0.64].map((offset, index) => {
          const pulse = makeSignalPulse(index === 1 ? '#ffffff' : pulseColor);
          pulse.userData.offset = offset;
          pulse.userData.speed = 0.12 + index * 0.025;
          scene.add(pulse);
          return pulse;
        });

        connectorsRef.current.push({
          tube,
          curve,
          pulses,
          sourceRegionId: event.region,
          targetRegionId: nextRegionId,
        });
      });
    }

    function resize() {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function onPointerMove(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onPointerLeave() {
      pointer.x = 2;
      pointer.y = 2;
      hoveredIdRef.current = null;
      setHoveredRegionId(null);
    }

    function onClick() {
      if (hoveredIdRef.current) {
        setSelectedRegionId(hoveredIdRef.current);
      }
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('click', onClick);
    window.addEventListener('resize', resize);
    resize();

    const clock = new THREE.Clock();

    function animate() {
      const elapsed = clock.getElapsedTime();
      requestAnimationFrame(animate);

      const mood = getPhaseMood(activeEventRef.current?.phase);
      scene.background.lerp(new THREE.Color(mood.fog), 0.06);
      scene.fog.color.lerp(new THREE.Color(mood.fog), 0.06);
      keyLight.color.lerp(new THREE.Color(mood.keyLight), 0.08);
      rimLight.color.lerp(new THREE.Color(mood.rimLight), 0.08);
      floorLight.color.lerp(new THREE.Color(mood.floorLight), 0.08);
      keyLight.intensity += (17.5 - keyLight.intensity + Math.sin(elapsed * 1.4) * 1.4) * 0.05;
      rimLight.intensity += (9.5 - rimLight.intensity + Math.sin(elapsed * 1.7 + 1.2) * 1.1) * 0.05;
      floorLight.intensity += (7.2 - floorLight.intensity + Math.sin(elapsed * 1.9 + 2.4) * 0.9) * 0.05;
      particleMaterial.color.lerp(new THREE.Color(mood.particle), 0.08);
      particleMaterial.opacity += ((activeEventRef.current ? 0.72 : 0.5) - particleMaterial.opacity) * 0.04;

      brainGroup.rotation.y = Math.sin(elapsed * 0.12) * 0.08 - 0.35;
      brainGroup.rotation.x = Math.sin(elapsed * 0.08) * 0.03;
      particles.rotation.y = elapsed * 0.012;

      raycaster.setFromCamera(pointer, camera);
      const regionList = [...regionMeshes.values()];
      const intersections = raycaster.intersectObjects(regionList, false);
      const hoveredId = intersections[0]?.object?.userData?.regionId || null;
      if (hoveredId !== hoveredIdRef.current) {
        hoveredIdRef.current = hoveredId;
        setHoveredRegionId(hoveredId);
      }

      const currentEvent = activeEventRef.current;
      if (currentEvent?.region !== animate.lastRegion || currentEvent?.timestamp !== animate.lastTimestamp) {
        animate.lastRegion = currentEvent?.region || null;
        animate.lastTimestamp = currentEvent?.timestamp || null;
        rebuildConnectors(currentEvent);
      }

      connectorsRef.current.forEach((connector, connectorIndex) => {
        connector.tube.material.opacity = currentEvent ? 0.44 + Math.sin(elapsed * 2.4 + connectorIndex) * 0.12 : 0.28;
        connector.pulses.forEach((pulse, pulseIndex) => {
          const travel = (elapsed * pulse.userData.speed + pulse.userData.offset) % 1;
          const position = connector.curve.getPointAt(travel);
          pulse.position.copy(position);
          const scale = 1 + Math.sin(elapsed * 7 + pulseIndex + connectorIndex) * 0.22;
          pulse.scale.setScalar(scale);
          pulse.material.opacity = 0.68 + Math.sin(elapsed * 6 + pulseIndex) * 0.16;
        });
      });

      regionMeshes.forEach((mesh, regionId) => {
        const activation = currentEvent?.region === regionId ? (currentEvent.activation || 0) / 100 : 0;
        const isNext = currentEvent?.next_regions?.includes(regionId);
        const isSelected = selectedIdRef.current === regionId;
        const isHovered = hoveredIdRef.current === regionId;
        const transferPulse = isNext ? 0.12 + Math.max(0, Math.sin(elapsed * 5.2 + mesh.position.x)) * 0.22 : 0;
        const intensity = 0.18 + activation * 1.3 + transferPulse + (isSelected ? 0.22 : 0) + (isHovered ? 0.12 : 0);
        const pulse = 1 + Math.sin(elapsed * 3.2 + mesh.position.x) * 0.03 * Math.max(activation, isSelected ? 0.6 : 0.25);
        const [baseX, baseY, baseZ] = mesh.userData.baseScale;
        mesh.scale.set(baseX * pulse, baseY * pulse, baseZ * pulse);
        mesh.material.emissiveIntensity = intensity;
        mesh.material.opacity = 0.68 + activation * 0.26 + (isSelected ? 0.05 : 0);
        mesh.material.color.set(isSelected ? '#ffffff' : mesh.userData.baseColor);
        mesh.rotation.y = Math.sin(elapsed * 0.7 + mesh.position.x) * 0.1;
      });

      REGIONS.forEach((region) => {
        const labelEl = labelRefs.current.get(region.id);
        const mesh = regionMeshes.get(region.id);
        if (!labelEl || !mesh) return;

        const anchor = mesh.position.clone().add(new THREE.Vector3(0, mesh.userData.baseScale[1] + 0.28, 0));
        anchor.project(camera);
        const x = (anchor.x * 0.5 + 0.5) * mount.clientWidth;
        const y = (-anchor.y * 0.5 + 0.5) * mount.clientHeight;
        const isVisible = anchor.z < 1;
        const isActive = currentEvent?.region === region.id;
        const isSelected = selectedIdRef.current === region.id;
        const isHovered = hoveredIdRef.current === region.id;
        const isNext = currentEvent?.next_regions?.includes(region.id);
        const opacity = isVisible ? (isActive || isSelected || isHovered || isNext ? 1 : 0.55) : 0;
        const scale = isActive || isSelected ? 1 : 0.94;
        labelEl.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
        labelEl.style.opacity = `${opacity}`;
        labelEl.dataset.flow = isNext ? 'next' : isActive ? 'active' : isSelected ? 'selected' : '';
      });

      renderer.render(scene, camera);
    }

    animate.lastRegion = null;
    animate.lastTimestamp = null;
    animate();

    return () => {
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
      clearConnectors();
      particlesGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      className="cbs-shell"
      data-phase={activeEvent?.phase || DEFAULT_PHASE}
      style={{
        '--cbs-accent': currentMood.accent,
        '--cbs-glow': currentMood.glow,
        '--cbs-glow-secondary': currentMood.glowSecondary,
        '--cbs-glow-tertiary': currentMood.glowTertiary,
        '--cbs-bg-start': currentMood.backgroundStart,
        '--cbs-bg-mid': currentMood.backgroundMid,
        '--cbs-bg-end': currentMood.backgroundEnd,
      }}
    >
      <div className="cbs-canvas" ref={mountRef} />
      <div className="cbs-label-layer">
        {REGIONS.map((region) => {
          const isActive = activeEvent?.region === region.id;
          const isSelected = selectedRegion.id === region.id;
          return (
            <button
              key={region.id}
              ref={(node) => {
                if (node) labelRefs.current.set(region.id, node);
                else labelRefs.current.delete(region.id);
              }}
              type="button"
              className={`cbs-floating-label ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedRegionId(region.id)}
            >
              <span className="cbs-floating-dot" style={{ background: region.color }} />
              <span>{region.label}</span>
            </button>
          );
        })}
      </div>

      <div className="cbs-hud">
        <section className="cbs-card cbs-card-main">
          <span className="t-label">Realtime Brain Trace</span>
          <h3>{activeEvent?.phase ? activeEvent.phase.replace(/_/g, ' ') : 'Idle State'}</h3>
          <p className="cbs-region">{activeEvent?.region_label || 'Dormant network'}</p>
          <p className="cbs-reason">
            {activeEvent?.reason || 'Soma is waiting for the next cognitive trigger.'}
          </p>
          <div className="cbs-chip-row">
            <div className="cbs-chip">
              <span className="t-label">Activation</span>
              <strong>{activeEvent?.activation ?? 0}%</strong>
            </div>
            <div className="cbs-chip">
              <span className="t-label">Events</span>
              <strong>{brainEvents.length}</strong>
            </div>
            <div className="cbs-chip">
              <span className="t-label">Next</span>
              <strong>{activeEvent?.next_regions?.length || 0}</strong>
            </div>
          </div>
        </section>

        {brainState.reflection && (
          <section className="cbs-card cbs-card-reflection">
            <span className="t-label">Internal Reflection</span>
            <p>{brainState.reflection}</p>
          </section>
        )}

        <section className="cbs-card cbs-card-detail">
          <div className="cbs-detail-head">
            <div>
              <span className="t-label">Region Detail</span>
              <h4>{selectedRegion.label}</h4>
            </div>
            <div className="cbs-detail-badge">
              <span className="t-label">Signal</span>
              <strong>{selectedEvent?.activation ?? 0}%</strong>
            </div>
          </div>

          <p className="cbs-detail-copy">{selectedRegion.description}</p>

          <div className="cbs-detail-grid">
            <div>
              <span className="t-label">Last Phase</span>
              <strong>{formatPhaseLabel(selectedEvent?.phase)}</strong>
            </div>
            <div>
              <span className="t-label">Timestamp</span>
              <strong>{formatTimestamp(selectedEvent?.timestamp)}</strong>
            </div>
            <div>
              <span className="t-label">Inputs Used</span>
              <strong>{selectedInputs.length || 0}</strong>
            </div>
            <div>
              <span className="t-label">Next Regions</span>
              <strong>{selectedTargets.length || 0}</strong>
            </div>
          </div>

          <p className="cbs-detail-reason">
            {selectedEvent?.reason || 'This region has not fired in the current cycle yet.'}
          </p>

          <div className="cbs-drawer-grid">
            <div className="cbs-drawer-block">
              <span className="t-label">Signal Destinations</span>
              {selectedTargets.length > 0 ? (
                <div className="cbs-mini-list">
                  {selectedTargets.map((target) => (
                    <span key={target} className="cbs-mini-pill">{target}</span>
                  ))}
                </div>
              ) : (
                <p className="cbs-drawer-empty">No downstream regions for this event.</p>
              )}
            </div>

            <div className="cbs-drawer-block">
              <span className="t-label">Inputs Used</span>
              {selectedInputs.length > 0 ? (
                <div className="cbs-mini-list">
                  {selectedInputs.map((input) => (
                    <span key={input} className="cbs-mini-pill">{input.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              ) : (
                <p className="cbs-drawer-empty">No explicit input metadata recorded.</p>
              )}
            </div>
          </div>

          <div className="cbs-drawer-block">
            <span className="t-label">Trace Payload</span>
            {selectedDataEntries.length > 0 ? (
              <div className="cbs-payload-list">
                {selectedDataEntries.map(([key, value]) => (
                  <div key={key} className="cbs-payload-row">
                    <span className="cbs-payload-key">{key.replace(/_/g, ' ')}</span>
                    <span className="cbs-payload-value">
                      {typeof value === 'string'
                        ? value
                        : Array.isArray(value)
                          ? `${value.length} item${value.length === 1 ? '' : 's'}`
                          : typeof value === 'object' && value !== null
                            ? `${Object.keys(value).length} fields`
                            : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="cbs-drawer-empty">No structured payload for this region event.</p>
            )}
          </div>
        </section>

        <section className="cbs-card cbs-card-regions">
          <span className="t-label">Region Map</span>
          <div className="cbs-region-grid">
            {REGIONS.map((region) => {
              const isActive = activeEvent?.region === region.id;
              const isSelected = selectedRegion.id === region.id;
              const isHovered = hoveredRegionId === region.id;
              return (
                <button
                  key={region.id}
                  className={`cbs-region-pill ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                  onClick={() => setSelectedRegionId(region.id)}
                  type="button"
                >
                  <span className="cbs-region-dot" style={{ background: region.color }} />
                  <span>{region.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="cbs-card cbs-card-timeline">
          <span className="t-label">Cognitive Timeline</span>
          <div className="cbs-timeline">
            {timeline.length === 0 ? (
              <p className="cbs-empty">Send a message to watch the brain perform cognition step by step.</p>
            ) : (
              timeline.map((event, index) => (
                <button
                  key={`${event.timestamp}-${index}`}
                  type="button"
                  className={`cbs-timeline-item ${selectedRegion.id === event.region ? 'selected' : ''}`}
                  onClick={() => setSelectedRegionId(event.region)}
                >
                  <div className="cbs-timeline-top">
                    <span className="cbs-timeline-phase">{event.phase.replace(/_/g, ' ')}</span>
                    <span className="cbs-timeline-activation">{event.activation}%</span>
                  </div>
                  <div className="cbs-timeline-region">{event.region_label}</div>
                  <div className="cbs-timeline-reason">{event.reason}</div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CognitiveBrainScene;
