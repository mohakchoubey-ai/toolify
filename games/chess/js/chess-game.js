// ============================================================
// CHESS GAME CONTROLLER — Board rendering, move handling, clocks
// ============================================================
class ChessGame {
  constructor(opts = {}) {
    this.boardEl     = opts.boardEl || document.getElementById('board');
    this.mode        = opts.mode || 'ai';       // 'ai' | 'pvp' | 'online'
    this.difficulty  = opts.difficulty || 2;    // 1-4
    this.timeControl = opts.timeControl || 300; // seconds, 0 = unlimited
    this.playerColor = opts.playerColor || 'white'; // for online
    this.onMove      = opts.onMove || null;     // callback(moveData)
    this.onGameOver  = opts.onGameOver || null;
    this.coordsOn    = opts.coordsOn !== false;
    this.showHints   = opts.showHints !== false;

    this.reset();
  }

  reset() {
    this.board = [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];
    this.turn        = 'white';
    this.selected    = null;
    this.validMoves  = [];
    this.history     = [];
    this.moveList    = [];  // {text, wasWhite}
    this.gameOver    = false;
    this.isThinking  = false;
    this.castleRights = { wK:true, wQ:true, bK:true, bQ:true };
    this.enPassant   = null;
    this.capturedByWhite = [];
    this.capturedByBlack = [];
    this.pendingPromotion = null;
    this.lastMoveCoords   = null;
    this.clocks      = { white: this.timeControl, black: this.timeControl };
    this._stopClock();
    this._startClock();
    this.render();
    this._updateClockDisplay();
    this._updateCapturedDisplay();
    this._updateStatus('White to move');
    // Hide overlays
    this._overlay('gameover', false);
    this._overlay('promo', false);
  }

  // ---- CLICK HANDLER ----
  handleClick(r, c) {
    if (this.gameOver || this.isThinking || this.pendingPromotion) return;
    if (this.mode === 'ai' && this.turn === 'black') return;

    const p = this.board[r][c];

    if (this.selected) {
      const move = this.validMoves.find(m => m.r===r && m.c===c);
      if (move) {
        this.lastMoveCoords = { fr:this.selected[0], fc:this.selected[1], tr:r, tc:c };
        if (move.special === 'promotion') {
          this.pendingPromotion = { fr:this.selected[0], fc:this.selected[1], tr:r, tc:c, white: isWhitePiece(this.board[this.selected[0]][this.selected[1]]) };
          this.selected = null; this.validMoves = [];
          this._showPromoPicker();
          this.render(); return;
        }
        this.commitMove(this.selected[0], this.selected[1], r, c, move.special, null);
        this.selected = null; this.validMoves = [];
        return;
      }
    }

    if (p && ((this.turn==='white' && isWhitePiece(p)) || (this.turn==='black' && !isWhitePiece(p)))) {
      this.selected = [r, c];
      this.validMoves = getLegalMoves(r, c, this.board, this.enPassant, this.castleRights);
    } else {
      this.selected = null; this.validMoves = [];
    }
    this.render();
  }

  // ---- COMMIT MOVE ----
  commitMove(fr, fc, tr, tc, special, promoPiece) {
    const piece = this.board[fr][fc];
    const white = isWhitePiece(piece);
    let captured = this.board[tr][tc];
    if (special==='enpassant') captured = this.board[fr][tc];

    // Snapshot for undo
    this.history.push({
      board: cloneBoard(this.board),
      castleRights: {...this.castleRights},
      enPassant: this.enPassant ? {...this.enPassant} : null,
      capturedByWhite: this.capturedByWhite.slice(),
      capturedByBlack: this.capturedByBlack.slice(),
      clocks: {...this.clocks},
      turn: this.turn,
      lastMoveCoords: this.lastMoveCoords ? {...this.lastMoveCoords} : null
    });

    applyMoveToBoard(this.board, fr, fc, tr, tc, special, promoPiece);

    if (captured) {
      if (white) this.capturedByWhite.push(captured);
      else this.capturedByBlack.push(captured);
    }

    // Update castling rights
    if (piece==='K') { this.castleRights.wK=false; this.castleRights.wQ=false; }
    if (piece==='k') { this.castleRights.bK=false; this.castleRights.bQ=false; }
    if (fr===7&&fc===0) this.castleRights.wQ=false;
    if (fr===7&&fc===7) this.castleRights.wK=false;
    if (fr===0&&fc===0) this.castleRights.bQ=false;
    if (fr===0&&fc===7) this.castleRights.bK=false;
    if (tr===7&&tc===0) this.castleRights.wQ=false;
    if (tr===7&&tc===7) this.castleRights.wK=false;
    if (tr===0&&tc===0) this.castleRights.bQ=false;
    if (tr===0&&tc===7) this.castleRights.bK=false;

    this.enPassant = special==='double' ? { r:(fr+tr)/2, c:fc } : null;

    // Build move text
    let text = squareName(fr,fc) + (captured?'x':'-') + squareName(tr,tc);
    if (special==='castleK') text='O-O';
    if (special==='castleQ') text='O-O-O';
    if (special==='promotion') text += '=' + (promoPiece||(white?'Q':'q')).toUpperCase();

    this.turn = white ? 'black' : 'white';

    const nowInCheck = isInCheck(!white, this.board, this.enPassant, this.castleRights);
    const oppLegal = getAllLegalMoves(!white, this.board, this.enPassant, this.castleRights);

    if (oppLegal.length===0) {
      this.gameOver = true;
      text += nowInCheck ? '#' : '';
    } else if (nowInCheck) {
      text += '+';
    }

    this._logMove(text, white);
    sfx(captured ? 'capture' : (special==='castleK'||special==='castleQ') ? 'castle' : 'move');
    if (nowInCheck && !this.gameOver) setTimeout(()=>sfx('check'), 60);

    this._updateCapturedDisplay();
    this.render();
    this._updateClockDisplay();

    if (this.onMove) this.onMove({ fr,fc,tr,tc,special,promoPiece,text,turn:this.turn,board:this.board });

    if (this.gameOver) {
      this._stopClock();
      sfx('mate');
      const title = nowInCheck ? (white?'White Wins by Checkmate':'Black Wins by Checkmate') : 'Draw — Stalemate';
      const sub   = nowInCheck ? '' : 'No legal moves, king not in check';
      this._showGameOver(title, sub);
      this._updateStatus('Game over', nowInCheck ? 'danger' : 'info');
      if (this.onGameOver) this.onGameOver({ winner: nowInCheck?(white?'white':'black'):null, reason: nowInCheck?'checkmate':'stalemate' });
      return;
    }

    if (nowInCheck) this._updateStatus((this.turn==='white'?'White':'Black') + ' is in check!', 'check');
    else this._updateStatus((this.turn==='white'?'White':'Black') + ' to move');

    // AI turn
    if (this.mode==='ai' && this.turn==='black') {
      this.isThinking = true;
      const badge = document.getElementById('ai-thinking-badge');
      if (badge) badge.classList.add('visible');
      const delay = Math.floor(Math.random()*900)+400;
      setTimeout(()=>{
        if (this.gameOver) return;
        const lm = getAllLegalMoves(false, this.board, this.enPassant, this.castleRights);
        const best = getBestMove(this.board, this.difficulty, lm);
        if (best) {
          this.lastMoveCoords = { fr:best.from[0], fc:best.from[1], tr:best.to[0], tc:best.to[1] };
          this.commitMove(best.from[0],best.from[1],best.to[0],best.to[1],best.special, best.special==='promotion'?'q':null);
        }
        this.isThinking = false;
        if (badge) badge.classList.remove('visible');
      }, delay);
    }
  }

  // ---- UNDO ----
  undoMove() {
    if (this.isThinking || this.pendingPromotion || !this.history.length) return;
    const steps = (this.mode==='ai' && this.history.length>=2 && this.turn==='white') ? 2 : 1;
    let snap;
    for (let i=0; i<steps && this.history.length; i++) snap = this.history.pop();
    if (!snap) return;
    this.board = snap.board;
    this.castleRights = snap.castleRights;
    this.enPassant = snap.enPassant;
    this.capturedByWhite = snap.capturedByWhite;
    this.capturedByBlack = snap.capturedByBlack;
    this.clocks = snap.clocks;
    this.turn = snap.turn;
    this.lastMoveCoords = snap.lastMoveCoords;
    this.gameOver = false;
    this.selected = null; this.validMoves = [];
    this._overlay('gameover', false);
    this._trimMoveList(steps);
    this._updateCapturedDisplay();
    this._updateClockDisplay();
    this._startClock();
    this.render();
    this._updateStatus((this.turn==='white'?'White':'Black') + ' to move');
  }

  // ---- RENDER ----
  render() {
    if (!this.boardEl) return;
    this.boardEl.querySelectorAll('.square').forEach(el => el.remove());

    const whiteInCheck = isInCheck(true, this.board, this.enPassant, this.castleRights);
    const blackInCheck = isInCheck(false, this.board, this.enPassant, this.castleRights);
    const wKing = findKing(true, this.board);
    const bKing = findKing(false, this.board);
    const lm = this.lastMoveCoords;
    const frag = document.createDocumentFragment();

    for (let r=0; r<8; r++) {
      for (let c=0; c<8; c++) {
        const sq = document.createElement('div');
        const isLight = (r+c)%2===0;
        sq.className = `square ${isLight?'light':'dark'}`;

        const disabled = this.gameOver || this.isThinking ||
          (this.mode==='ai' && this.turn==='black') ||
          (this.mode==='online' && this.playerColor !== this.turn);
        if (disabled) sq.classList.add('disabled');

        if (this.selected && this.selected[0]===r && this.selected[1]===c) sq.classList.add('selected');
        if (lm) {
          if (lm.fr===r && lm.fc===c) sq.classList.add('last-move-from');
          if (lm.tr===r && lm.tc===c) sq.classList.add('last-move-to');
        }
        if (whiteInCheck && wKing && wKing[0]===r && wKing[1]===c) sq.classList.add('in-check');
        if (blackInCheck && bKing && bKing[0]===r && bKing[1]===c) sq.classList.add('in-check');

        const hint = this.showHints ? this.validMoves.find(m=>m.r===r&&m.c===c) : null;
        if (hint) {
          sq.classList.add('hint');
          if (hint.special==='capture'||hint.special==='enpassant'||this.board[r][c]) sq.classList.add('capture-hint');
        }

        const p = this.board[r][c];
        if (p) {
          const pw = document.createElement('span');
          pw.className = 'piece-wrap';
          pw.textContent = PIECE_SYMBOLS[p];
          sq.appendChild(pw);
        }

        // Coordinates
        if (this.coordsOn) {
          if (c===0) { const s=document.createElement('span'); s.className='coord rank'; s.textContent=(8-r); sq.appendChild(s); }
          if (r===7) { const s=document.createElement('span'); s.className='coord file'; s.textContent='abcdefgh'[c]; sq.appendChild(s); }
        }

        sq.onclick = () => this.handleClick(r, c);
        frag.appendChild(sq);
      }
    }

    const promoEl = document.getElementById('promo-overlay');
    const gameoverEl = document.getElementById('gameover-overlay');
    if (promoEl) this.boardEl.insertBefore(frag, promoEl);
    else if (gameoverEl) this.boardEl.insertBefore(frag, gameoverEl);
    else this.boardEl.appendChild(frag);

    // Update active player cards
    document.querySelectorAll('.player-card').forEach(el => el.classList.remove('active-player'));
    const activeCard = document.getElementById(this.turn===('white')?'white-player-card':'black-player-card');
    if (activeCard) activeCard.classList.add('active-player');

    // Clock highlights
    const wc = document.getElementById('white-clock');
    const bc = document.getElementById('black-clock');
    if (wc) { wc.classList.toggle('active', this.turn==='white'&&!this.gameOver); }
    if (bc) { bc.classList.toggle('active', this.turn==='black'&&!this.gameOver); }
  }

  // ---- CLOCKS ----
  _startClock() {
    this._stopClock();
    if (!this.timeControl) {
      const wc = document.getElementById('white-clock');
      const bc = document.getElementById('black-clock');
      if (wc) wc.textContent = '∞';
      if (bc) bc.textContent = '∞';
      return;
    }
    this._clockInterval = setInterval(()=>{
      if (this.gameOver || this.pendingPromotion) return;
      this.clocks[this.turn]--;
      if (this.clocks[this.turn] <= 0) {
        this.clocks[this.turn] = 0;
        this.gameOver = true;
        this._stopClock();
        this._updateClockDisplay();
        sfx('mate');
        const winner = this.turn==='white' ? 'Black' : 'White';
        this._showGameOver(`Time Out — ${winner} Wins`, `${this.turn==='white'?'White':'Black'} ran out of time`);
        if (this.onGameOver) this.onGameOver({ winner: this.turn==='white'?'black':'white', reason:'timeout' });
        return;
      }
      this._updateClockDisplay();
    }, 1000);
  }

  _stopClock() {
    if (this._clockInterval) { clearInterval(this._clockInterval); this._clockInterval = null; }
  }

  _updateClockDisplay() {
    const wc = document.getElementById('white-clock');
    const bc = document.getElementById('black-clock');
    if (!this.timeControl) return;
    if (wc) {
      wc.textContent = fmtTimeSec(this.clocks.white);
      wc.classList.toggle('low-time', this.clocks.white<=30 && this.clocks.white>0);
    }
    if (bc) {
      bc.textContent = fmtTimeSec(this.clocks.black);
      bc.classList.toggle('low-time', this.clocks.black<=30 && this.clocks.black>0);
    }
  }

  // ---- CAPTURED PIECES ----
  _updateCapturedDisplay() {
    const wb = document.getElementById('captured-by-white');
    const bb = document.getElementById('captured-by-black');
    const mat = this._materialAdv();
    if (wb) wb.textContent = this.capturedByWhite.map(p=>PIECE_SYMBOLS[p]).join('') + (mat>0?` +${mat}`:'');
    if (bb) bb.textContent = this.capturedByBlack.map(p=>PIECE_SYMBOLS[p]).join('') + (mat<0?` +${Math.abs(mat)}`:'');
  }

  _materialAdv() {
    let w=0, b=0;
    this.capturedByWhite.forEach(p => w += PIECE_VALUES[p.toLowerCase()]||0);
    this.capturedByBlack.forEach(p => b += PIECE_VALUES[p.toLowerCase()]||0);
    return w - b;
  }

  // ---- MOVE LIST ----
  _logMove(text, wasWhite) {
    this.moveList.push({ text, wasWhite });
    const listEl = document.getElementById('move-list');
    if (!listEl) return;
    const num = Math.ceil(this.moveList.length / 2);
    if (wasWhite) {
      const row = document.createElement('div');
      row.className = 'move-row';
      row.dataset.num = num;
      row.innerHTML = `<span class="m-idx">${num}.</span><span class="m-w">${text}</span><span class="m-b"></span>`;
      listEl.appendChild(row);
    } else {
      const rows = listEl.querySelectorAll('.move-row');
      const last = rows[rows.length-1];
      if (last) last.querySelector('.m-b').textContent = text;
    }
    listEl.scrollTop = listEl.scrollHeight;
  }

  _trimMoveList(steps) {
    for (let i=0; i<steps; i++) this.moveList.pop();
    const listEl = document.getElementById('move-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    this.moveList.forEach(({text, wasWhite}) => this._logMove(text, wasWhite));
  }

  // ---- STATUS ----
  _updateStatus(msg, type='') {
    const el = document.getElementById('status-banner');
    if (!el) return;
    el.textContent = msg;
    el.className = `status-banner${type?' '+type:''}`;
  }

  // ---- OVERLAYS ----
  _overlay(name, show) {
    const el = document.getElementById(name+'-overlay');
    if (el) el.classList.toggle('visible', !!show);
  }

  _showGameOver(title, sub) {
    const t = document.getElementById('gameover-title');
    const s = document.getElementById('gameover-sub');
    if (t) t.textContent = title;
    if (s) s.textContent = sub;
    this._overlay('gameover', true);
  }

  _showPromoPicker() {
    const row = document.getElementById('promo-row');
    if (!row) { this._autoPromote(); return; }
    row.innerHTML = '';
    const w = this.pendingPromotion.white;
    (w?['Q','R','B','N']:['q','r','b','n']).forEach(pc => {
      const div = document.createElement('div');
      div.className = 'promo-piece';
      div.textContent = PIECE_SYMBOLS[pc];
      div.onclick = () => {
        this._overlay('promo', false);
        const { fr, fc, tr, tc } = this.pendingPromotion;
        this.lastMoveCoords = { fr, fc, tr, tc };
        this.pendingPromotion = null;
        this.commitMove(fr, fc, tr, tc, 'promotion', pc);
      };
      row.appendChild(div);
    });
    this._overlay('promo', true);
  }

  _autoPromote() {
    if (!this.pendingPromotion) return;
    const { fr, fc, tr, tc, white } = this.pendingPromotion;
    this.lastMoveCoords = { fr, fc, tr, tc };
    this.pendingPromotion = null;
    this.commitMove(fr, fc, tr, tc, 'promotion', white?'Q':'q');
  }

  // ---- GETSTATE (for online sync) ----
  getState() {
    return {
      board: this.board,
      turn: this.turn,
      castleRights: this.castleRights,
      enPassant: this.enPassant,
      capturedByWhite: this.capturedByWhite,
      capturedByBlack: this.capturedByBlack,
      clocks: this.clocks,
      gameOver: this.gameOver,
      lastMoveCoords: this.lastMoveCoords,
      moveList: this.moveList,
      updatedAt: Date.now()
    };
  }

  applyState(state) {
    if (!state) return;
    this.board = state.board || this.board;
    this.turn = state.turn || 'white';
    this.castleRights = state.castleRights || {wK:true,wQ:true,bK:true,bQ:true};
    this.enPassant = state.enPassant || null;
    this.capturedByWhite = state.capturedByWhite || [];
    this.capturedByBlack = state.capturedByBlack || [];
    this.clocks = state.clocks || this.clocks;
    this.gameOver = !!state.gameOver;
    this.lastMoveCoords = state.lastMoveCoords || null;
    this.moveList = state.moveList || [];
    this.selected = null; this.validMoves = []; this.pendingPromotion = null;
    this._overlay('promo', false);
    if (this.gameOver) this._stopClock(); else this._startClock();
    this._rebuildMoveListDOM();
    this._updateCapturedDisplay();
    this._updateClockDisplay();
    this.render();
    if (!this.gameOver) {
      const inCheck = isInCheck(this.turn==='white', this.board, this.enPassant, this.castleRights);
      this._updateStatus(inCheck ? (this.turn==='white'?'White':'Black')+' is in check!' : (this.turn==='white'?'White':'Black')+' to move', inCheck?'check':'');
    }
  }

  _rebuildMoveListDOM() {
    const el = document.getElementById('move-list');
    if (!el) return;
    el.innerHTML = '';
    const tmp = this.moveList.slice();
    this.moveList = [];
    tmp.forEach(({text, wasWhite}) => this._logMove(text, wasWhite));
  }

  destroy() { this._stopClock(); }
}