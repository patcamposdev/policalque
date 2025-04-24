const gerarBtn = document.getElementById("gerar-campos");
const medidasDiv = document.getElementById("campos-medidas");
const calcularBtn = document.getElementById("calcular-area");
const form = document.getElementById("polygon-form");
const resultadoDiv = document.getElementById("resultado");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let numLados = 0;

const direcoes = {
  "cima":    { x: 0, y: 1 },
  "direita": { x: 1, y: 0 },
  "baixo":   { x: 0, y: -1 },
  "esquerda":{ x: -1, y: 0 }
};
const nomeDirecoes = {"cima":"Cima","direita":"Direita","baixo":"Baixo","esquerda":"Esquerda"};

gerarBtn.addEventListener('click', () => {
  medidasDiv.innerHTML = '';
  numLados = parseInt(document.getElementById("num-lados").value);
  if (isNaN(numLados) || numLados < 3) {
    alert("Informe um número de lados (mínimo 3)");
    return;
  }

  for(let i=0; i<numLados; i++){
    medidasDiv.innerHTML += `
      <div>
        <span>Lado ${i+1}:</span>
        <input type="number" min="0.01" step="0.01" placeholder="Comprimento (m)" id="comprimento${i}" required>
        <select id="direcao${i}" required>
          <option value="cima">Cima</option>
          <option value="direita">Direita</option>
          <option value="baixo">Baixo</option>
          <option value="esquerda">Esquerda</option>
        </select>
        <input type="number" min="0" max="180" step="1" value="90" id="angulo${i}" ${i==(numLados-1)?'readonly style="background:#e3e3e3"':''} required>°
      </div>
    `;
  }
  calcularBtn.style.display = "block";
  canvas.style.display = "none";
  resultadoDiv.innerHTML = '';

  calculaAnguloFechamento(); // Sugere ângulo de fechamento logo que gera

  setTimeout(() => {
    for(let i=0; i<numLados; i++) {
      document.getElementById(`comprimento${i}`).addEventListener('input', () => {desenharEmTempoReal(); if(i==numLados-2) calculaAnguloFechamento()});
      document.getElementById(`direcao${i}`).addEventListener('change', () => {desenharEmTempoReal(); if(i==numLados-2) calculaAnguloFechamento()});
      if (i != numLados-1) { // Só libera edição nos anteriores
        document.getElementById(`angulo${i}`).addEventListener('input', () => {desenharEmTempoReal(); if(i==numLados-2) calculaAnguloFechamento()});
      }
    }
  }, 100);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  resultadoDiv.innerHTML = '';
  const pontos = calculaPontos();
  // Cálculo da área (Shoelace)
  let area = 0;
  for (let i = 0; i < pontos.length - 1; i++) {
    area += pontos[i].x * pontos[i+1].y - pontos[i+1].x * pontos[i].y;
  }
  area = Math.abs(area) / 2;
  resultadoDiv.innerHTML = `<h2>Área: ${area.toFixed(2)} m²</h2>`;
  desenharPoligono(pontos);
});

function calculaPontos(overwriteLastAngle=false) {
  let pontos = [{x:0, y:0}];
  let atual = {x: 0, y: 0};
  for(let i=0; i<numLados; i++){
    let angulo = parseFloat(document.getElementById(`angulo${i}`).value);
    const comprimento = parseFloat(document.getElementById(`comprimento${i}`).value);
    const direcao = document.getElementById(`direcao${i}`).value;
    if(isNaN(angulo) || isNaN(comprimento) || comprimento <= 0) break;

    // Vetor base para essa direção (sentido do eixo Y para cima no início)
    let v = direcoes[direcao];

    // Transforma 90º em reto na direção, <90 ou >90 é um ajuste
    let anguloRadianos = (angulo - 90)*(Math.PI/180);
    let cosA = Math.cos(anguloRadianos);
    let sinA = Math.sin(anguloRadianos);

    // Rotaciona vetor da direção pelo ângulo
    let x = v.x * cosA - v.y * sinA;
    let y = v.x * sinA + v.y * cosA;

    let novoPonto = {
      x: atual.x + x * comprimento,
      y: atual.y + y * comprimento
    };
    pontos.push(novoPonto);
    atual = novoPonto;
  }
  // Se veio de "calculaAnguloFechamento", não retorna o último ponto duplicado
  if(overwriteLastAngle && pontos.length > numLados) pontos.pop();
  return pontos;
}

// Calcula ângulo que fecha a figura e preenche o último campo automaticamente (readonly)
function calculaAnguloFechamento() {
  let pontos = [{x:0, y:0}];
  let atual = {x: 0, y: 0};
  let angulos = [];
  for(let i=0; i<numLados-1; i++){
    let angulo = parseFloat(document.getElementById(`angulo${i}`).value);
    const comprimento = parseFloat(document.getElementById(`comprimento${i}`).value);
    const direcao = document.getElementById(`direcao${i}`).value;
    if(isNaN(angulo) || isNaN(comprimento) || comprimento <= 0) return;
    let v = direcoes[direcao];
    let anguloRadianos = (angulo - 90)*(Math.PI/180);
    let cosA = Math.cos(anguloRadianos);
    let sinA = Math.sin(anguloRadianos);
    let x = v.x * cosA - v.y * sinA;
    let y = v.x * sinA + v.y * cosA;
    let novoPonto = {
      x: atual.x + x * comprimento,
      y: atual.y + y * comprimento
    };
    pontos.push(novoPonto);
    atual = novoPonto;
    angulos.push(angulo);
  }
  // Agora calcula o vetor p0→pN
  const pontoFinal = pontos[pontos.length-1];
  const pontoOrigem = pontos[0];
  const delta = {x: pontoOrigem.x - pontoFinal.x, y: pontoOrigem.y - pontoFinal.y};
  const comprimentoFinal = parseFloat(document.getElementById(`comprimento${numLados-1}`).value);
  const direcaoFinal = document.getElementById(`direcao${numLados-1}`).value;
  if(!comprimentoFinal || comprimentoFinal <= 0) return;
  let vF = direcoes[direcaoFinal];

  // Para o último lado, calcula qual seria o ângulo para alcançar o ponto inicial
  // Vetor do lado:
  if(comprimentoFinal === 0) return;
  let xf = delta.x / comprimentoFinal;
  let yf = delta.y / comprimentoFinal;

  // Ângulo entre o vetor da direção escolhida e o necessário para fechar
  let anguloDirecaoRad = Math.atan2(vF.y, vF.x);
  let anguloLadoRad = Math.atan2(yf, xf);
  let deltaAng = anguloLadoRad - anguloDirecaoRad;
  // Converte para parâmetro de entrada de campo:
  let anguloSugestao = 90 + (deltaAng * 180/Math.PI);
  anguloSugestao = Math.round(anguloSugestao);
  if(anguloSugestao < 0) anguloSugestao = 0;
  if(anguloSugestao > 180) anguloSugestao = 180;
  document.getElementById(`angulo${numLados-1}`).value = anguloSugestao;
}

function desenharEmTempoReal() {
  const pontos = calculaPontos();
  if (pontos.length > 1) {
    desenharPoligono(pontos);
  } else {
    canvas.style.display = 'none';
  }
}

function desenharPoligono(pontos) {
  canvas.style.display = "block";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Limites do polígono para escalar
  let minX = Math.min(...pontos.map(p => p.x));
  let maxX = Math.max(...pontos.map(p => p.x));
  let minY = Math.min(...pontos.map(p => p.y));
  let maxY = Math.max(...pontos.map(p => p.y));

  let poligonoLargura = maxX - minX;
  let poligonoAltura  = maxY - minY;

  let margem = 20;
  let escala = Math.min(
    (canvas.width  - 2*margem) / (poligonoLargura || 1),
    (canvas.height - 2*margem) / (poligonoAltura  || 1)
  );

  let pontosCanvas = pontos.map(p => ({
    x: margem + (p.x - minX) * escala,
    y: canvas.height - margem - (p.y - minY) * escala  // inversão Y
  }));

  // Único traçado (não fecha se incompleto)
  ctx.beginPath();
  ctx.moveTo(pontosCanvas[0].x, pontosCanvas[0].y);
  for (let i = 1; i < pontosCanvas.length; i++) {
    ctx.lineTo(pontosCanvas[i].x, pontosCanvas[i].y);
  }
  // Fecha e preenche só se "circular"
  if (
    pontos.length > 2 &&
    Math.abs(pontos[0].x - pontos[pontos.length-1].x) < 1e-2 &&
    Math.abs(pontos[0].y - pontos[pontos.length-1].y) < 1e-2
  ) {
    ctx.closePath();
    ctx.fillStyle = "#90caf9";
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = "#1976d2";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vértices
  pontosCanvas.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#d32f2f";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Valores dos lados
  ctx.font = "bold 14px Arial";
  ctx.fillStyle = "#222";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;

  for (let i = 0; i < pontosCanvas.length - 1; i++) {
    const p1 = pontosCanvas[i];
    const p2 = pontosCanvas[i + 1];
    // Meio do lado
    const meioX = (p1.x + p2.x) / 2;
    const meioY = (p1.y + p2.y) / 2;
    // Comprimento real
    const deltaX = pontos[i+1].x - pontos[i].x;
    const deltaY = pontos[i+1].y - pontos[i].y;
    const comprimento = Math.sqrt(deltaX*deltaX + deltaY*deltaY);

    ctx.strokeText(`${comprimento.toFixed(2)}m`, meioX+6, meioY-7);
    ctx.fillText(`${comprimento.toFixed(2)}m`, meioX+6, meioY-7);
  }
}