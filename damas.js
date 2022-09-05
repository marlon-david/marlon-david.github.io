var Jogo = function(idElemento, opcoes) {
	this.tab = document.getElementById(idElemento);

	// TODO: corrigir comer múltiplas vezes seguidas (as vezes outra peça pode comer e não é passada a vez pro adversário)
	// TODO: corrigir também quando tenta comer 3 ou mais vezes seguidas (tem que clicar de novo na peça)

	this.tabWidth = opcoes['width'] || 640;
	this.tabHeight = opcoes['height'] || 640;

	// largura e altura da unidade do tabuleiro
	this.w = this.tabWidth / 8;
	this.h = this.tabHeight / 8;

	this.posicoes1 = [];
	this.posicoes2 = [];

	this.movimentos1 = 0;
	this.movimentos2 = 0;

	this.pontuacao1 = 0;
	this.pontuacao2 = 0;

	this.pos1Color = "#FF0000";
	this.pos2Color = "#0080FF";

	this.vez = 2;

	this.indexSelecionado = null;
	this.movimentosPossiveis = [];
	this.possivelComer = [];

	this.pendenteComer = false;
	this.ganhador = false;
	this.recomerAtivo = false;

	this.duracaoTransicao = 200;
	this.maxCasas = opcoes['maxCasas'] || 1;
	this.multiJogador = opcoes['multi'] || false;

	this.pintar = function() {
		var x, y, cor;

		this.tab.innerHTML = '';
		this.tab.style.position = "relative";
		this.tab.style.width = this.tabWidth + "px";
		this.tab.style.height = this.tabHeight + "px";

		for (x=0; x<8; x++) {
			for (y=0; y<8; y++) {
				if (((x + y) % 2) == 0) {
					cor = "#242424";
				} else {
					cor = "#101010";
				}
				var div = document.createElement('div');
				div.className = 'casa';
				div.style.boxSizing = "border-box";
				div.style.width = this.w + "px";
				div.style.height = this.h + "px";
				div.style.backgroundColor = cor;
				div.style.position = "absolute";
				div.style.left = (x * this.w) + "px";
				div.style.top = (y * this.h) + "px";
				div.style.transition = "all " + this.duracaoTransicao + "ms ease-out";
				this.tab.appendChild(div);
			}
		}
	}

	this.adicionarPeca = function(num, x, y) {
		this['posicoes' + num].push({
			x: x,
			y: y,
			elemento: null,
			dama: false,
			mover: [],
			comer: []
		});
	}

	this.inicializarPecas = function(num) {
		var x, y;

		var pos = (num == 1 || num == '1')
			? 0
			: 5;
		var fimY = pos + 3;

		for (x=0; x<4; x++) {
			for (y=pos; y<fimY; y++) {
				if ((y % 2) == 0) {
					this.adicionarPeca(num, x*2+1, y);
				} else {
					this.adicionarPeca(num, x*2, y);
				}
			}
		}

		this.colocarPecasEmPosicoes(num);
	}

	this.colocarPecasEmPosicoes = function(num) {
		var i,
			total = this['posicoes' + num].length,
			peca;

		var centro = this.w/4;
		var larguraPeca = this.w/2;
		var larguraDetalhe = larguraPeca * 0.5;
		var cor = this['pos' + num + 'Color'];
		var larguraBorda = 7;
		var indice = this.tab.childElementCount;

		for (i=0; i<total; i++) {
			peca = this['posicoes' + num][i];

			var div = document.createElement('div');
			div.className = 'peca';
			div.style.boxSizing = "border-box";
			div.style.width = larguraPeca + "px";
			div.style.height = larguraPeca + "px";
			if (peca.dama) {
				div.style.backgroundColor = "#FFFFFF";
				div.style.border = "solid " + larguraBorda + "px " + cor;
				div.style.boxShadow = "0px 0px 10px #FFFFFF";
			} else {
				div.style.backgroundColor = cor;
			}
			div.style.left = peca.x*this.w + centro + "px";
			div.style.top = peca.y*this.h + centro + "px";
			div.style.position = "absolute";
			div.style.borderRadius = "50%";
			div.style.transition = "all " + this.duracaoTransicao + "ms ease-out";

			this.tab.appendChild(div);
			this['posicoes' + num][i].elemento = this.tab.children[indice + i];
		}
	}

	this.clique = function(event) {
		if (this.ganhador == false) {
			var initX = this.tab.offsetLeft, initY = this.tab.offsetTop;
			var posX = Math.floor((event.clientX - initX + window.scrollX) / this.w);
			var posY = Math.floor((event.clientY - initY + window.scrollY) / this.h);

			// console.log([event.clientX, event.clientY]);
			// console.log([posX, posY]);
			this.selecionar(posX, posY);
		}
	}

	this.selecionar = function(x, y) {
		console.log('selecionar ' + x + ', ' + y);
		if (((x + y) % 2) == 1) {

			this.removerDestaque();
			var pos = this.consultarPosicao(x, y);

			if (this.ganhador !== false) {
				return false;
			}

			if (pos.jogador == 0) {
				// verificar se é um movimento
				if (this.indexSelecionado !== null) {
					var i,
						total = this.possivelComer.length,
						concorrente = (this.vez == 1) ? 2 : 1;

					for (i=0; i<total; i++) {
						if (this.possivelComer[i].x == x
							&& this.possivelComer[i].y == y) {
							this.comer(concorrente, this.possivelComer[i]);
						}
					}

					if (!this.pendenteComer) {
						total = this.movimentosPossiveis.length;

						for (i=0; i<total; i++) {
							if (typeof this.movimentosPossiveis[i] == "undefined") {
								console.log(this.movimentosPossiveis);
								continue;
							}
							if (this.movimentosPossiveis[i][0] == x
								&& this.movimentosPossiveis[i][1] == y) {
								this.mover(x, y);
							}
						}
					}
				} else {
					console.log('indexSelecionado nullo');
				}
			} else if (pos.jogador == this.vez) {
				this.indexSelecionado = pos.index;
				this.movimentosPossiveis = this['posicoes' + this.vez][pos.index].mover;
				this.possivelComer = this['posicoes' + this.vez][pos.index].comer;

				var i,
					total = this.possivelComer.length;

				for (i=0; i<total; i++) {
					this.destacar(this.possivelComer[i].x, this.possivelComer[i].y);
				}

				if (!this.pendenteComer) {
					total = this.movimentosPossiveis.length;

					for (i=0; i<total; i++) {
						this.destacar(this.movimentosPossiveis[i][0], this.movimentosPossiveis[i][1]);
					}
				}

				if (this.possivelComer.length > 0 ||
					(this.movimentosPossiveis.length > 0 && !this.pendenteComer)) {
					var indice = x * 8 + y;
					this.tab.children[indice].style.border = "1px solid #00FF00";
				} else {
					this.indexSelecionado = null;
				}

				return true;
			} else {
				console.log('pos invalida');
			}
		}

		if (this.recomerAtivo) {
			return false;
		}

		this.indexSelecionado = null;
	}

	this.destacar = function(x, y) {
		if (((x + y) % 2) == 1) {
			var indice = x * 8 + y;
			this.tab.children[indice].style.border = "1px solid #FFFF00";
		}
	}

	this.removerDestaque = function() {
		var i, total = 64;
		for (i=0; i<total; i++) {
			this.tab.children[i].style.border = "none";
		}
	}

	this.consultarPosicao = function(x, y) {
		var i,
			total = this.posicoes2.length,
			peca;

		for (i=0; i<total; i++) {
			peca = this.posicoes2[i];
			if (peca.x == x && peca.y == y) {
				return {
					index: i,
					jogador: 2
				};
			}
		}
		
		total = this.posicoes1.length;

		for (i=0; i<total; i++) {
			peca = this.posicoes1[i];
			if (peca.x == x && peca.y == y) {
				return {
					index: i,
					jogador: 1
				};
			}
		}

		return {
			index: null,
			jogador: 0
		};
	}

	this.verificarOcupado = function(x, y) {
		return this.consultarPosicao(x, y).jogador;
	}

	this.consultarCasasVizinhas = function(jogador, index, posX, posY) {
		var x = this['posicoes' + jogador][index].x;
		var y = this['posicoes' + jogador][index].y;
		var concorrente = (jogador == 1) ? 2 : 1;
		var i, mov, pulo, vizinho;

		var result = {
			comer: null,
			mover: null
		};

		var maxCasas = (this['posicoes' + jogador][index].dama) ? parseInt(this.maxCasas) : 1;

		for (i=1; i<=maxCasas; i++) {
			mov = {
				x: (posX == 'left') ? x-i : x+i,
				y: (posY == 'top') ? y-i : y+i
			};

			pulo = {
				x: (posX == 'left') ? x-i-1 : x+i+1,
				y: (posY == 'top') ? y-i-1 : y+i+1
			};

			if (mov.x > -1 && mov.x < 8 && mov.y > -1 && mov.y < 8) {
				vizinho = this.consultarPosicao(mov.x, mov.y);

				if (vizinho.jogador == concorrente &&
					pulo.x > -1 && pulo.x < 8 && pulo.y > -1 && pulo.y < 8) {
					if (this.verificarOcupado(pulo.x, pulo.y) == 0) {
						result.comer = {
							index: vizinho.index,
							x: pulo.x,
							y: pulo.y
						};

						this['posicoes' + jogador][index].comer.push(result.comer);

						if (this.vez == jogador) {
							this.pendenteComer = true;
						}

						this['movimentos' + jogador] += 1;
					}

					break;
				} else if (vizinho.jogador == 0) {
					result.mover = [mov.x, mov.y];

					this['posicoes' + jogador][index].mover.push(result.mover);

					this['movimentos' + jogador] += 1;
				} else {
					break;
				}
			}
		}

		return result;
	}

	this.calcularTodosOsMovimentos = function() {
		// console.log('calculando todos os movimentos');
		var jogador, i, total, subir, descer;

		this.movimentos1 = 0;
		this.movimentos2 = 0;

		for (jogador = 1; jogador < 3; jogador++) {
			subir = (jogador == 2);
			descer = (jogador == 1);

			total = this['posicoes' + jogador].length;

			for (i=0; i<total; i++) {
				this['posicoes' + jogador][i].comer = [];
				this['posicoes' + jogador][i].mover = [];

				if (subir || this['posicoes' + jogador][i].dama) {
					this.consultarCasasVizinhas(jogador, i, 'left',  'top');
					this.consultarCasasVizinhas(jogador, i, 'right', 'top');
				}

				if (descer || this['posicoes' + jogador][i].dama) {
					this.consultarCasasVizinhas(jogador, i, 'left', 'bottom');
					this.consultarCasasVizinhas(jogador, i, 'right', 'bottom');
				}
			}
		}
	}

	this.recomer = function() {
		var jogador = this.vez,
			i = this.indexSelecionado,
			subir = (jogador == 2),
			descer = (jogador == 1);

		this.pendenteComer = false;
		this['movimentos' + jogador] = 0;

		this['posicoes' + jogador][i].comer = [];
		this['posicoes' + jogador][i].mover = [];

		if (subir || this['posicoes' + jogador][i].dama) {
			this.consultarCasasVizinhas(jogador, i, 'left', 'top');
			this.consultarCasasVizinhas(jogador, i, 'right', 'top');
		}

		if (descer || this['posicoes' + jogador][i].dama) {
			this.consultarCasasVizinhas(jogador, i, 'left', 'bottom');
			this.consultarCasasVizinhas(jogador, i, 'right', 'bottom');
		}

		return (this['posicoes' + jogador][i].comer.length > 0);
	}

	this.mover = function(x, y) {
		// var old = this['posicoes' + this.vez][this.indexSelecionado];
		// console.log('movendo jogador ' + this.vez + ' peca de [' + old[0] + ', ' + old[1] + ']');
		// console.log('nova posicao: [' + x + ', ' + y + ']');
		this.reposicionar(this['posicoes' + this.vez][this.indexSelecionado], x, y);
		this.aposMovimento(false);
	}

	this.comer = function(jogadorAlvo, objComer) {
		if (jogadorAlvo != this.vez) {
			this.reposicionar(this['posicoes' + this.vez][this.indexSelecionado], objComer.x, objComer.y);

			this.removerPeca(jogadorAlvo, objComer.index);
			
			this['pontuacao' + this.vez] += 1;
			this.mostrarPontuacao();
			this.aposMovimento(true);
		}
	}

	this.reposicionar = function(peca, novoX, novoY) {
		var centro = this.w/4;
		peca.x = novoX;
		peca.y = novoY;
		peca.elemento.style.left = (novoX * this.w) + centro + "px";
		peca.elemento.style.top = (novoY * this.h) + centro + "px";
		if (novoY == 7 && this.vez == 1) {
			this.transformarEmDama(peca);
		} else if (novoY == 0 && this.vez == 2) {
			this.transformarEmDama(peca);
		}
	}

	this.transformarEmDama = function(peca) {
		var larguraBorda = 7;
		var cor = this['pos' + this.vez + 'Color'];
		peca.dama = true;
		peca.elemento.style.backgroundColor = "#FFFFFF";
		peca.elemento.style.border = "solid " + larguraBorda + "px " + cor;
		peca.elemento.style.boxShadow = "0px 0px 10px #FFFFFF";
	}

	this.removerPeca = function(jogadorAlvo, indice) {
		var tabuleiro = this.tab;
		var peca = this['posicoes' + jogadorAlvo][indice].elemento;
		peca.style.transform = "scale(2)";
		peca.style.opacity = 0.01;
		this['posicoes' + jogadorAlvo].splice(indice, 1);
		window.setTimeout(function() {
			tabuleiro.removeChild(peca);
		}, this.duracaoTransicao);
	}

	this.aposMovimento = function(aposComer) {
		this.removerDestaque();

		if (aposComer == true && this.recomer()) {
			if (!this.recomerAtivo) {
				var i = this.indexSelecionado;
				this.recomerAtivo = true;
				this.selecionar(
					this['posicoes' + this.vez][i].x,
					this['posicoes' + this.vez][i].y
				);
				if (this.vez == 1 && !this.multiJogador) {
					this.pensador.recomer();
				}
				this.indexSelecionado = i;
			}
			return false;
		} else {
			this.recomerAtivo = false;
			this.indexSelecionado = null;

			if (this.vez == 1) {
				this.vez = 2;
				document.getElementById('vez').innerHTML = "azul";
			} else {
				this.vez = 1;
				document.getElementById('vez').innerHTML = "vermelho";
			}

			this.pendenteComer = false;
			this.calcularTodosOsMovimentos();

			if (this.movimentos1 == 0) {
				this.ganhador = 2;
				window.alert("Time azul ganhador");
			} else if (this.vez == 1 && !this.multiJogador) {
				this.pensador.jogar();
			}

			if (this.movimentos2 == 0) {
				this.ganhador = 1;
				window.alert("Time vermelho ganhador");
			}
		}
	}

	this.novoJogo = function() {
		this.pintar();
		this.inicializarPecas('1');
		this.inicializarPecas('2');
		this.mostrarPontuacao();
		this.indexSelecionado = null;
		this.vez = 2;
		document.getElementById('vez').innerHTML = "azul";
		this.movimentosPossiveis = [];
		this.possivelComer = [];
		this.ganhador = false;
		
		this.pendenteComer = false;

		this.calcularTodosOsMovimentos();
	}

	this.mostrarPontuacao = function() {
		var html = 'Time azul: ' + this.pontuacao2;
		html += '<br>';
		html += 'Time vermelho: ' + this.pontuacao1;
		document.getElementById("pontuacao").innerHTML = html;
	}

	this.novoJogo();

	var jogo = this;

	this.tab.addEventListener("click", function(event){
		jogo.clique(event)
	});

	this.pensador = {
		jogar: function() {
			if (jogo.ganhador != false || jogo.movimentos1 == 0) {
				return false;
			}
			var possibilidades = [];
			var i, total = jogo.posicoes1.length, r, j, total2,
				acao = (jogo.pendenteComer) ? 'comer' : 'mover';

			for (i=0; i<total; i++) {
				total2 = jogo.posicoes1[i][acao].length;

				for (j=0; j<total2; j++) {
					if (acao == "comer") {
						possibilidades.push({index: i, x: jogo.posicoes1[i][acao][j].x, y: jogo.posicoes1[i][acao][j].y});
					} else {
						possibilidades.push({ index: i, x: jogo.posicoes1[i][acao][j][0], y: jogo.posicoes1[i][acao][j][1] });
					}
				}
			}

			total = possibilidades.length;

			if (total > 1) {
				do {
					r = Math.round(Math.random() * 100) % total;
				} while (!(r in possibilidades));
			} else {
				r = 0;
			}

			var peca = jogo.posicoes1[possibilidades[r].index];

			jogo.selecionar(peca.x, peca.y);
			jogo.selecionar(possibilidades[r].x, possibilidades[r].y);
		},

		recomer: function () {
			if (jogo.ganhador != false || jogo.movimentos1 == 0 || !jogo.pendenteComer) {
				return false;
			}
			var possibilidades = [];
			var i, total = jogo.posicoes1[jogo.indexSelecionado].comer.length;

			for (i = 0; i < total; i++) {
				possibilidades.push({
					index: jogo.indexSelecionado,
					x: jogo.posicoes1[jogo.indexSelecionado].comer[i].x,
					y: jogo.posicoes1[jogo.indexSelecionado].comer[i].y
				});
			}

			total = possibilidades.length;

			if (total > 1) {
				do {
					r = Math.round(Math.random() * 100) % total;
				} while (!(r in possibilidades));
			} else {
				r = 0;
			}

			window.setTimeout(function() {
				jogo.selecionar(possibilidades[r].x, possibilidades[r].y);
			}, jogo.duracaoTransicao);
		}
	};
};