const gerarBtn = document.getElementById("gerar-campos");
const medidasDiv = document.getElementById("campos-medidas");
const calcularBtn = document.getElementById("calcular-area");
const form = document.getElementById("polygon-form");
const resultadoDiv = document.getElementById("resultado");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let numLados = 0;

gerarBtn.addEventListener('click', () => {
  medidasDiv.innerHTML = '';
  numLados = parseInt(document.getElementById("num-lados").value);
  if (isNaN(numLados) || numLados < 4) {
    alert("Informe um número de lados (mínimo 4)");
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
      </div>
    `;
  }
  calcularBtn.style.display = "block";
  canvas.style.display = "none"; // Esconde o desenho ao criar novos campos
  resultadoDiv.innerHTML = '';

  // Escuta as mudanças dos campos para desenhar em tempo real
  setTimeout(() => {
    for(let i=0; i<numLados; i++) {
      document.getElementById(`comprimento${i}`).addEventListener('input', desenharEmTempoReal);
      document.getElementById(`direcao${i}`).addEventListener('change', desenharEmTempoReal);
    }
  }, 100);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  resultadoDiv.innerHTML = '';

  let pontos = [{x:0, y:0}];
  let atual = {x:0, y:0};
  for(let i=0; i<numLados; i++){
    const lado = parseFloat(document.getElementById(`comprimento${i}`).value);
    const direcao = document.getElementById(`direcao${i}`).value;
    let novoPonto = {...atual};
    switch(direcao){
      case "cima":
        novoPonto.y += lado;
        break;
      case "direita":
        novoPonto.x += lado;
        break;
      case "baixo":
        novoPonto.y -= lado;
        break;
      case "esquerda":
        novoPonto.x -= lado;
        break;
    }
    pontos.push(novoPonto);
    atual = novoPonto;
  }

  // Cálculo da área (Shoelace)
  let area = 0;
  for (let i=0; i<numLados; i++) {
    area += pontos[i].x * pontos[i+1].y - pontos[i+1].x * pontos[i].y;
  }
  area = Math.abs(area) / 2;
  resultadoDiv.innerHTML = `<h2>Área: ${area.toFixed(2)} m²</h2>`;

  desenharPoligono(pontos);
});

// Função para desenhar enquanto vai preenchendo
function desenharEmTempoReal() {
  let pontos = [{x:0, y:0}];
  let atual = {x:0, y:0};
  for(let i=0; i<numLados; i++){
    let campoComp = document.getElementById(`comprimento${i}`);
    let campoDir = document.getElementById(`direcao${i}`);
    const lado = parseFloat(campoComp.value);
    const direcao = campoDir.value;
    if (isNaN(lado) || lado <= 0) break;
    let novoPonto = {...atual};
    switch(direcao){
      case "cima": novoPonto.y += lado; break;
      case "direita": novoPonto.x += lado; break;
      case "baixo": novoPonto.y -= lado; break;
      case "esquerda": novoPonto.x -= lado; break;
    }
    pontos.push(novoPonto);
    atual = novoPonto;
  }
  if (pontos.length > 1) {
    desenharPoligono(pontos);
  } else {
    canvas.style.display = 'none';
  }
}

// Função para desenhar o polígono e mostrar valores dos lados
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

  // Converte pontos para escala do canvas
  let pontosCanvas = pontos.map(p => ({
    x: margem + (p.x - minX) * escala,
    y: canvas.height - margem - (p.y - minY) * escala
  }));

  // Identifica se polígono está fechado (só fecha se o último ponto coincide com o primeiro)
  let fechar = (pontos.length > 2
    && pontos[0].x === pontos[pontos.length-1].x
    && pontos[0].y === pontos[pontos.length-1].y);

  // Desenha o contorno do polígono
  ctx.beginPath();
  ctx.moveTo(pontosCanvas[0].x, pontosCanvas[0].y);
  for (let i = 1; i < pontosCanvas.length; i++) {
    ctx.lineTo(pontosCanvas[i].x, pontosCanvas[i].y);
  }
  if (fechar) ctx.closePath();
  ctx.strokeStyle = "#1976d2";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Colore somente se está fechado
  if (fechar) {
    ctx.fillStyle = "#90caf9";
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Marca os vértices
  pontosCanvas.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#d32f2f";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Mostra valores dos lados
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

    // Comprimento
    const deltaX = pontos[i+1].x - pontos[i].x;
    const deltaY = pontos[i+1].y - pontos[i].y;
    const comprimento = Math.sqrt(deltaX*deltaX + deltaY*deltaY);

    // Texto contornado
    ctx.strokeText(`${comprimento.toFixed(2)}m`, meioX+5, meioY-5);
    ctx.fillText(`${comprimento.toFixed(2)}m`, meioX+5, meioY-5);
  }
}