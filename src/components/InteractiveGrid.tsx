import React, { useEffect, useRef } from "react";

// Beautiful, harmonious palette of colors matching the Loomscape natural aesthetic
const ELEGANT_PALETTE = [
  "#5A5A40", // Loom Slate (signature brand color)
  "#8A9A86", // Sage Green
  "#D9A05B", // Ochre Yellow
  "#C27D65", // Terracotta Clay
  "#6B7F96", // Slate Blue
  "#C29B9B", // Muted Rose
  "#8E8294", // Muted Lavender
  "#D98373", // Soft Coral
];

interface MosaicBlock {
  id: string;
  col: number;
  row: number;
  color: string;
  opacity: number;
  targetOpacity: number;
  life: number; // starts at 1.0 and decays
  decay: number;
  delay: number; // staggered animations
}

export default function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // High performance refs to avoid triggering state updates on every mousemove/animation frame
  const blocksRef = useRef<MosaicBlock[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isOver: false, gridX: -1, gridY: -1 });
  const lastSpawnRef = useRef({ gridX: -1, gridY: -1, time: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get parent element of this component to capture mouse movements
    const parentElement = canvas.parentElement;
    if (!parentElement) return;

    // Resize handler to make canvas pixel-perfect on Retina and normal screens
    const handleResize = () => {
      const rect = parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      ctx.scale(dpr, dpr);
    };

    // Use ResizeObserver for accurate sizing
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(parentElement);
    handleResize();

    // Spawns a symmetrical GitHub Identicon pattern centered at a grid coordinate
    const spawnIdenticonCluster = (centerX: number, centerY: number, color: string) => {
      // 5x5 Grid: We generate the left 3 columns randomly, and mirror them to the right 2 columns
      const pattern: boolean[][] = [];
      for (let r = 0; r < 5; r++) {
        pattern[r] = [];
        // Col 0, 1, 2
        for (let c = 0; c < 3; c++) {
          pattern[r][c] = Math.random() > 0.45; // ~55% density
        }
        // Mirror to Col 3, 4
        pattern[r][3] = pattern[r][1];
        pattern[r][4] = pattern[r][0];
      }

      // Add blocks with staggered delay based on Manhattan distance from center
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (pattern[r][c]) {
            const colOffset = c - 2;
            const rowOffset = r - 2;
            const targetCol = centerX + colOffset;
            const targetRow = centerY + rowOffset;

            // Generate unique id for debugging/reconciliation
            const id = `${targetCol}_${targetRow}_${Date.now()}_${Math.random()}`;

            // Check if block already exists near here to prevent extreme overlapping
            const exists = blocksRef.current.some(
              (b) => b.col === targetCol && b.row === targetRow && b.life > 0.4
            );

            if (!exists) {
              blocksRef.current.push({
                id,
                col: targetCol,
                row: targetRow,
                color,
                opacity: 0,
                targetOpacity: 0.5 + Math.random() * 0.4, // Muted peak opacity
                life: 1.0,
                decay: 0.005 + Math.random() * 0.01, // slow fade-out for weaving trail
                delay: (Math.abs(colOffset) + Math.abs(rowOffset)) * 3, // staggered bloom!
              });
            }
          }
        }
      }
    };

    // Mouse handlers on parent to avoid blocking click events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = parentElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Spacing grid size is 24px
      const gridX = Math.floor(mouseX / 24);
      const gridY = Math.floor(mouseY / 24);

      mouseRef.current = { x: mouseX, y: mouseY, isOver: true, gridX, gridY };

      const now = Date.now();
      const lastSpawn = lastSpawnRef.current;
      
      // Calculate grid distance from last spawn
      const distance = Math.sqrt(
        Math.pow(gridX - lastSpawn.gridX, 2) + Math.pow(gridY - lastSpawn.gridY, 2)
      );

      // Throttled spawn: Spawns if moved at least 2 cells away, or if 350ms elapsed
      if (distance >= 2 || (now - lastSpawn.time > 350 && distance >= 0.8)) {
        const randomColor = ELEGANT_PALETTE[Math.floor(Math.random() * ELEGANT_PALETTE.length)];
        spawnIdenticonCluster(gridX, gridY, randomColor);
        
        lastSpawnRef.current = { gridX, gridY, time: now };
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.isOver = false;
    };

    parentElement.addEventListener("mousemove", handleMouseMove);
    parentElement.addEventListener("mouseleave", handleMouseLeave);

    // Animation frame loop
    let animationId: number;
    
    const render = () => {
      const rect = parentElement.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const gridSize = 24;
      const cols = Math.ceil(rect.width / gridSize) + 1;
      const rows = Math.ceil(rect.height / gridSize) + 1;

      // 1. Draw the dot grid (matching the CSS grid exactly, but on-canvas for pixel perfect layout)
      ctx.fillStyle = "#E4DFD5"; // Subtle elegant gray
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          ctx.beginPath();
          // Coordinates align precisely with corners of our grid cells
          ctx.arc(c * gridSize, r * gridSize, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Ambient spawn logic: randomly spawns small patterns to keep background alive
      if (Math.random() < 0.008 && blocksRef.current.length < 35) {
        const randCol = Math.floor(Math.random() * cols);
        const randRow = Math.floor(Math.random() * rows);
        const randomColor = ELEGANT_PALETTE[Math.floor(Math.random() * ELEGANT_PALETTE.length)];
        spawnIdenticonCluster(randCol, randRow, randomColor);
      }

      // 3. Update and render active blocks
      const updatedBlocks: MosaicBlock[] = [];
      
      for (let i = 0; i < blocksRef.current.length; i++) {
        const block = blocksRef.current[i];

        // Stagger handle
        if (block.delay > 0) {
          block.delay -= 1;
          updatedBlocks.push(block);
          continue;
        }

        // Fade out transition
        block.life -= block.decay;

        if (block.life > 0) {
          // Smooth fade in
          if (block.opacity < block.targetOpacity) {
            block.opacity += 0.06;
            if (block.opacity > block.targetOpacity) {
              block.opacity = block.targetOpacity;
            }
          }

          // Smooth fade out at the end of life
          if (block.life < 0.3) {
            block.opacity = block.targetOpacity * (block.life / 0.3);
          }

          // Math: Bounded by 4 adjacent dots: (col, row), (col+1, row), (col, row+1), (col+1, row+1)
          // We draw the block inside with a beautiful 2px padding, leaving the dots fully visible!
          const padding = 2;
          const x = block.col * gridSize + padding;
          const y = block.row * gridSize + padding;
          const size = gridSize - padding * 2;

          // Render block with subtle glass/woven texture: translucent fill + solid hairline border
          ctx.save();
          ctx.globalAlpha = block.opacity;
          
          // Soft colorful fill
          ctx.fillStyle = block.color;
          ctx.fillRect(x, y, size, size);

          // Beautiful solid border
          ctx.strokeStyle = block.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

          ctx.restore();

          updatedBlocks.push(block);
        }
      }
      blocksRef.current = updatedBlocks;

      // 4. Draw interactive hover cell highlight
      if (mouseRef.current.isOver) {
        const hx = mouseRef.current.gridX * gridSize + 2;
        const hy = mouseRef.current.gridY * gridSize + 2;
        const size = gridSize - 4;
        
        ctx.save();
        ctx.strokeStyle = "rgba(90, 90, 64, 0.45)"; // Soft loom slate outline
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]); // Dotted grid alignment preview
        ctx.strokeRect(hx + 0.5, hy + 0.5, size - 1, size - 1);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      parentElement.removeEventListener("mousemove", handleMouseMove);
      parentElement.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
}
