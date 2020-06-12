import esri = __esri;
import FeatureFilter = require("esri/views/layers/support/FeatureFilter");
import Color = require("esri/Color");
import { years, months } from "./constants";

let mousemoveEnabled = true;

let highlighted:CellHighlight = null;
let layerView: esri.FeatureLayerView = null;

let data: ChartData[] = [];

const start = new Color("#F2F2F2");
const end = new Color("#72246C");
const numCols = 4;
const numRows = 12;

function normalize(value:number, minValue:number, maxValue:number) {
  return (value - minValue) / (maxValue - minValue);
}

export function updateGrid(newData?: ChartData[], lv?: esri.FeatureLayerView, clearHighlight?: boolean) {
  highlighted = clearHighlight ? null : highlighted;
  data = newData ? newData : data;
  layerView = lv ? lv : layerView;
  const pixelRatio = window.devicePixelRatio;
  const canvas = document.getElementById("chartCanvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth * pixelRatio;
  const height = canvas.clientHeight * pixelRatio;
  canvas.width = width;
  canvas.height = height;
  const cellWidth = width / numCols;
  const cellHeight = height / numRows;
  
  let minValue = +Infinity;
  let maxValue = -Infinity;
  
  for (const {value} of data) {
    minValue = Math.min(value, minValue);
    maxValue = Math.max(value, maxValue);
  }

  ctx.clearRect(0, 0, width, height);

  for (const { col, row, value} of data) {
    const ratio = normalize(value, minValue, maxValue);

    const fillColor = new Color({
      r: Math.round(start.r + (end.r - start.r) * ratio),
      g: Math.round(start.g + (end.g - start.g) * ratio),
      b: Math.round(start.b + (end.b - start.b) * ratio),
      a: Math.round(start.a + (end.a - start.a) * ratio)
    });

    ctx.fillStyle = fillColor.toCss();
    ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);

    // Draw text
    ctx.fillStyle = "white";
    ctx.strokeStyle = "#72246C";
    // ctx.fill
    ctx.lineWidth = 4;
    ctx.textBaseline = "middle";
    ctx.font = `${12 * pixelRatio}px "Avenir Next W00","Helvetica Neue",Helvetica,Arial,sans-serif`;
    ctx.textAlign = "center";
    ctx.strokeText(
      "" + value,
      col * cellWidth + cellWidth / 2,
      row * cellHeight + cellHeight / 2
    );
    ctx.fillText(
      "" + value,
      col * cellWidth + cellWidth / 2,
      row * cellHeight + cellHeight / 2
    );
    
  }

  // draw highlighted cell
  if (highlighted) {
    const w = 3 * pixelRatio;
    ctx.strokeStyle = "rgba(50,50,50,1)";
    ctx.lineWidth = w;
    ctx.strokeRect(highlighted.col * cellWidth + w / 2, highlighted.row * cellHeight + w / 2, cellWidth - w, cellHeight - w);
  } else {
    ctx.strokeStyle = null;
    ctx.lineWidth = 0;
  }
}

function addCanvasListeners() {
  const canvas = document.getElementById("chartCanvas") as HTMLCanvasElement;

  function selectCell (event: any) {
    const pixelRatio = window.devicePixelRatio;
    const { width, height } = canvas;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    onCellSelect({
      col: Math.floor(x / (width / pixelRatio) * numCols), 
      row: Math.floor(y / (height / pixelRatio) * numRows)
    });
  }

  canvas.addEventListener("mousemove", selectCell);
  canvas.addEventListener("click", (event) => {
    mousemoveEnabled = !mousemoveEnabled;
    selectCell(event);
  });

  canvas.addEventListener("mouseleave", () => {
    if(mousemoveEnabled){
      layerView.filter = null;
      updateGrid(null, null, true);
      // clearCellHighlight();
    }
  });
}

// export function clearCellHighlight (){
//   highlighted = null;
// }

function onCellSelect(cell:CellHighlight) {
  
  const year = years[cell.col];
  const month = months[cell.row];

  if(mousemoveEnabled){
    highlighted = { col: cell.col, row: cell.row };
    layerView.filter = new FeatureFilter({
      where: `Year = '${year}' AND MonthName = '${month}'`
    });
  }
  updateGrid();
}

addCanvasListeners();
