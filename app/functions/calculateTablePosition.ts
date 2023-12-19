export function calculateTablePosition(index: number, totalTables: number) {
    const gridSize = Math.ceil(Math.sqrt(totalTables));
    const gap = 250;
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    return {
      x: 100 + col * gap,
      y: 100 + row * gap,
    };
}