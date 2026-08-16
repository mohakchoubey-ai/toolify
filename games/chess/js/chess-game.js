// ============================================================
// CHESS GAME CONTROLLER — Fixed board, animated moves, slow AI
// ============================================================
class ChessGame {
  constructor(opts={}) {
    this.boardEl     = opts.boardEl || document.getElementById('board');
    this.mode        = opts.mode || 'ai';
    this.difficulty  = opts.difficulty || 2;
    this.timeControl = opts.timeControl || 300;
    this.playerColor = opts.playerColor || 'white';
    this.onMove      = opts.onMove || null;
    this.onGameOver  = opts.onGameOver || null;
    this.coordsOn    = opts.coordsOn !== false;
    this.showHints   = opts.showHints !== false;
    this._animating  = false;
    this.reset();
  }

  reset() {
    this.board=[['r','n','b','q','k','b','n','r'],['p','p','p','p','p','p','p','p'],['','','','','','','',''],['','','','','','','',''],['','','','','','','',''],['','','','','','','',''],['P','P','P','P','P','P','P','P'],['R','N','B','Q','K','B','N','R']];
    this.turn='white'; this.selected=null; this.validMoves=[]; this.history=[];
    this.moveList=[]; this.gameOver=false; this.isThinking=false;
    this.castleRights={wK:true,wQ:true,bK:true,bQ:true};
    this.enPassant=null; this.capturedByWhite=[]; this.capturedByBlack=[];
    this.pendingPromotion=null; this.lastMoveCoords=null;
    this.clocks={white:this.timeControl,black:this.timeControl};
    this._stopClock(); this._animating=false;
    this._startClock();
    this.render();
    this._updateClockDisplay();
    this._updateCapturedDisplay();
    this._updateStatus('White to move');
    this._overlay('gameover',false);
    this._overlay('promo',false);
  }

  // ── CLICK ──
  handleClick(r,c) {
    if(this.gameOver||this.isThinking||this.pendingPromotion||this._animating) return;
    if(this.mode==='ai'&&this.turn==='black') return;
    if(this.mode==='online'&&this.playerColor!==this.turn) return;
    const p=this.board[r][c];
    if(this.selected) {
      const move=this.validMoves.find(m=>m.r===r&&m.c===c);
      if(move) {
        if(move.special==='promotion') {
          this.pendingPromotion={fr:this.selected[0],fc:this.selected[1],tr:r,tc:c,white:isWhitePiece(this.board[this.selected[0]][this.selected[1]])};
          this.selected=null; this.validMoves=[];
          this._showPromoPicker(); this.render(); return;
        }
        const fr=this.selected[0],fc=this.selected[1];
        this.selected=null; this.validMoves=[];
        this._animateMove(fr,fc,r,c,move.special,null);
        return;
      }
    }
    if(p&&((this.turn==='white'&&isWhitePiece(p))||(this.turn==='black'&&!isWhitePiece(p)))) {
      this.selected=[r,c];
      this.validMoves=getLegalMoves(r,c,this.board,this.enPassant,this.castleRights);
    } else {
      this.selected=null; this.validMoves=[];
    }
    this.render();
  }

  // ── ANIMATED MOVE ──
  _animateMove(fr,fc,tr,tc,special,promoPiece,skipAnim=false) {
    if(skipAnim||this.mode==='online') {
      this.lastMoveCoords={fr,fc,tr,tc};
      this.commitMove(fr,fc,tr,tc,special,promoPiece);
      return;
    }
    this._animating=true;
    // Get pixel positions of from/to squares
    const boardRect=this.boardEl.closest('.chessboard-container')?.getBoundingClientRect()||this.boardEl.getBoundingClientRect();
    const sqW=boardRect.width/8, sqH=boardRect.height/8;
    const fromX=fc*sqW, fromY=fr*sqH;
    const toX=tc*sqW, toY=tr*sqH;
    const dx=toX-fromX, dy=toY-fromY;

    // Find the piece element and animate
    const squares=this.boardEl.querySelectorAll('.square');
    const idx=fr*8+fc;
    const fromSq=squares[idx];
    const pieceEl=fromSq?.querySelector('.piece');
    if(pieceEl) {
      pieceEl.style.transition='none';
      pieceEl.style.transform='translate(0,0)';
      // Force reflow
      pieceEl.getBoundingClientRect();
      pieceEl.style.transition='transform .22s cubic-bezier(.25,.46,.45,.94)';
      pieceEl.style.transform=`translate(${dx}px,${dy}px)`;
      setTimeout(()=>{
        this._animating=false;
        this.lastMoveCoords={fr,fc,tr,tc};
        this.commitMove(fr,fc,tr,tc,special,promoPiece);
      },230);
    } else {
      this._animating=false;
      this.lastMoveCoords={fr,fc,tr,tc};
      this.commitMove(fr,fc,tr,tc,special,promoPiece);
    }
  }

  // ── COMMIT MOVE ──
  commitMove(fr,fc,tr,tc,special,promoPiece) {
    const piece=this.board[fr][fc];
    const white=isWhitePiece(piece);
    let captured=this.board[tr][tc];
    if(special==='enpassant') captured=this.board[fr][tc];

    this.history.push({
      board:cloneBoard(this.board),castleRights:{...this.castleRights},
      enPassant:this.enPassant?{...this.enPassant}:null,
      capturedByWhite:this.capturedByWhite.slice(),capturedByBlack:this.capturedByBlack.slice(),
      clocks:{...this.clocks},turn:this.turn,lastMoveCoords:this.lastMoveCoords?{...this.lastMoveCoords}:null
    });

    applyMoveToBoard(this.board,fr,fc,tr,tc,special,promoPiece);
    if(captured){if(white)this.capturedByWhite.push(captured);else this.capturedByBlack.push(captured);}

    // Castle rights
    if(piece==='K'){this.castleRights.wK=false;this.castleRights.wQ=false;}
    if(piece==='k'){this.castleRights.bK=false;this.castleRights.bQ=false;}
    if(fr===7&&fc===0)this.castleRights.wQ=false; if(fr===7&&fc===7)this.castleRights.wK=false;
    if(fr===0&&fc===0)this.castleRights.bQ=false; if(fr===0&&fc===7)this.castleRights.bK=false;
    if(tr===7&&tc===0)this.castleRights.wQ=false; if(tr===7&&tc===7)this.castleRights.wK=false;
    if(tr===0&&tc===0)this.castleRights.bQ=false; if(tr===0&&tc===7)this.castleRights.bK=false;

    this.enPassant=special==='double'?{r:(fr+tr)/2,c:fc}:null;

    // Move text
    let text=squareName(fr,fc)+(captured?'x':'-')+squareName(tr,tc);
    if(special==='castleK') text='O-O';
    if(special==='castleQ') text='O-O-O';
    if(special==='promotion') text+='='+(promoPiece||(white?'Q':'q')).toUpperCase();

    this.turn=white?'black':'white';
    const nowInCheck=isInCheck(!white,this.board,this.enPassant,this.castleRights);
    const oppLegal=getAllLegalMoves(!white,this.board,this.enPassant,this.castleRights);

    if(oppLegal.length===0){
      this.gameOver=true;
      text+=nowInCheck?'#':'';
    } else if(nowInCheck) text+='+';

    this._logMove(text,white);

    // Sounds
    if(special==='castleK'||special==='castleQ') sfx('castle');
    else if(special==='promotion') sfx('promotion');
    else if(captured) sfx('capture');
    else sfx('move');
    if(nowInCheck&&!this.gameOver) setTimeout(()=>sfx('check'),80);

    this._updateCapturedDisplay();
    this.render();
    this._updateClockDisplay();

    if(this.onMove) this.onMove({fr,fc,tr,tc,special,promoPiece,text,turn:this.turn,board:this.board});

    if(this.gameOver){
      this._stopClock();
      setTimeout(()=>sfx('game-end'),100);
      const title=nowInCheck?(white?'White Wins by Checkmate':'Black Wins by Checkmate'):'Draw — Stalemate';
      const sub=nowInCheck?'':(white?'Black':'White')+' has no legal moves';
      this._showGameOver(title,sub);
      this._updateStatus('Game over','info');
      if(this.onGameOver) this.onGameOver({winner:nowInCheck?(white?'white':'black'):null,reason:nowInCheck?'checkmate':'stalemate'});
      return;
    }

    if(nowInCheck) this._updateStatus((this.turn==='white'?'White':'Black')+' is in check!','check');
    else this._updateStatus((this.turn==='white'?'White':'Black')+' to move');

    // AI turn — realistic human-like delay
    if(this.mode==='ai'&&this.turn==='black') {
      this.isThinking=true;
      const badge=document.getElementById('ai-thinking-badge');
      if(badge) badge.classList.add('visible');
      const lm=getAllLegalMoves(false,this.board,this.enPassant,this.castleRights);
      // Thinking time: 1.5s–4s based on difficulty
      const minT=[0,1500,2000,2500,3000][this.difficulty]||1500;
      const maxT=[0,2500,3500,4500,5500][this.difficulty]||3000;
      const thinkTime=Math.floor(Math.random()*(maxT-minT))+minT;
      setTimeout(()=>{
        if(this.gameOver) return;
        const best=getBestMove(this.board,this.difficulty,lm);
        if(best) {
          this.lastMoveCoords={fr:best.from[0],fc:best.from[1],tr:best.to[0],tc:best.to[1]};
          this.isThinking=false;
          if(badge) badge.classList.remove('visible');
          this._animateMove(best.from[0],best.from[1],best.to[0],best.to[1],best.special,best.special==='promotion'?'q':null);
        } else {
          this.isThinking=false;
          if(badge) badge.classList.remove('visible');
        }
      },thinkTime);
    }
  }

  // ── UNDO ──
  undoMove() {
    if(this.isThinking||this.pendingPromotion||!this.history.length||this._animating) return;
    const steps=(this.mode==='ai'&&this.history.length>=2&&this.turn==='white')?2:1;
    let snap;
    for(let i=0;i<steps&&this.history.length;i++) snap=this.history.pop();
    if(!snap) return;
    this.board=snap.board; this.castleRights=snap.castleRights; this.enPassant=snap.enPassant;
    this.capturedByWhite=snap.capturedByWhite; this.capturedByBlack=snap.capturedByBlack;
    this.clocks=snap.clocks; this.turn=snap.turn; this.lastMoveCoords=snap.lastMoveCoords;
    this.gameOver=false; this.selected=null; this.validMoves=[];
    this._overlay('gameover',false);
    this._trimMoveList(steps);
    this._updateCapturedDisplay(); this._updateClockDisplay(); this._startClock();
    this.render();
    this._updateStatus((this.turn==='white'?'White':'Black')+' to move');
  }

  // ── RENDER ──
  render() {
    if(!this.boardEl) return;
    // Wrap board in container if not already
    let container=this.boardEl.closest('.chessboard-container');
    if(!container){
      container=document.createElement('div');
      container.className='chessboard-container';
      this.boardEl.parentNode.insertBefore(container,this.boardEl);
      container.appendChild(this.boardEl);
    }

    this.boardEl.querySelectorAll('.square').forEach(el=>el.remove());
    const wInCheck=isInCheck(true,this.board,this.enPassant,this.castleRights);
    const bInCheck=isInCheck(false,this.board,this.enPassant,this.castleRights);
    const wKing=findKing(true,this.board), bKing=findKing(false,this.board);
    const lm=this.lastMoveCoords;
    const frag=document.createDocumentFragment();

    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const sq=document.createElement('div');
      const isLight=(r+c)%2===0;
      sq.className=`square ${isLight?'light':'dark'}`;

      const disabled=this.gameOver||this.isThinking||this._animating||
        (this.mode==='ai'&&this.turn==='black')||
        (this.mode==='online'&&this.playerColor!==this.turn);
      if(disabled) sq.classList.add('disabled');

      if(this.selected&&this.selected[0]===r&&this.selected[1]===c) sq.classList.add('selected');
      if(lm){if(lm.fr===r&&lm.fc===c)sq.classList.add('last-move-from');if(lm.tr===r&&lm.tc===c)sq.classList.add('last-move-to');}
      if(wInCheck&&wKing&&wKing[0]===r&&wKing[1]===c) sq.classList.add('in-check');
      if(bInCheck&&bKing&&bKing[0]===r&&bKing[1]===c) sq.classList.add('in-check');

      const hint=this.showHints?this.validMoves.find(m=>m.r===r&&m.c===c):null;
      if(hint){sq.classList.add('hint');if(hint.special==='capture'||hint.special==='enpassant'||this.board[r][c])sq.classList.add('capture-hint');}

      const p=this.board[r][c];
      if(p){
        const pw=document.createElement('span');
        pw.className='piece';
        pw.textContent=PIECE_SYMBOLS[p];
        sq.appendChild(pw);
      }

      // Coords
      if(this.coordsOn){
        if(c===0){const s=document.createElement('span');s.className='coord rank';s.textContent=(8-r);sq.appendChild(s);}
        if(r===7){const s=document.createElement('span');s.className='coord file';s.textContent='abcdefgh'[c];sq.appendChild(s);}
      }

      sq.onclick=()=>this.handleClick(r,c);
      frag.appendChild(sq);
    }

    const promoEl=document.getElementById('promo-overlay');
    const goEl=document.getElementById('gameover-overlay');
    if(promoEl) this.boardEl.insertBefore(frag,promoEl);
    else if(goEl) this.boardEl.insertBefore(frag,goEl);
    else this.boardEl.appendChild(frag);

    // Active player card
    document.querySelectorAll('.player-card').forEach(el=>el.classList.remove('active-player'));
    const ac=document.getElementById(this.turn==='white'?'white-player-card':'black-player-card');
    if(ac) ac.classList.add('active-player');

    // Clock highlights
    const wc=document.getElementById('white-clock'),bc=document.getElementById('black-clock');
    if(wc) wc.classList.toggle('active',this.turn==='white'&&!this.gameOver);
    if(bc) bc.classList.toggle('active',this.turn==='black'&&!this.gameOver);
  }

  // ── CLOCKS ──
  _startClock() {
    this._stopClock();
    if(!this.timeControl){
      ['white-clock','black-clock'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='∞';});
      return;
    }
    this._clockInterval=setInterval(()=>{
      if(this.gameOver||this.pendingPromotion) return;
      this.clocks[this.turn]--;
      if(this.clocks[this.turn]<=0){
        this.clocks[this.turn]=0; this.gameOver=true;
        this._stopClock(); this._updateClockDisplay();
        sfx('game-end');
        const winner=this.turn==='white'?'Black':'White';
        this._showGameOver(`Time Out — ${winner} Wins`,`${this.turn==='white'?'White':'Black'} ran out of time`);
        if(this.onGameOver) this.onGameOver({winner:this.turn==='white'?'black':'white',reason:'timeout'});
        return;
      }
      this._updateClockDisplay();
    },1000);
  }
  _stopClock(){if(this._clockInterval){clearInterval(this._clockInterval);this._clockInterval=null;}}
  _updateClockDisplay(){
    if(!this.timeControl) return;
    const wc=document.getElementById('white-clock'),bc=document.getElementById('black-clock');
    if(wc){wc.textContent=fmtTimeSec(this.clocks.white);wc.classList.toggle('low-time',this.clocks.white<=30&&this.clocks.white>0);}
    if(bc){bc.textContent=fmtTimeSec(this.clocks.black);bc.classList.toggle('low-time',this.clocks.black<=30&&this.clocks.black>0);}
  }

  // ── CAPTURED ──
  _updateCapturedDisplay(){
    const mat=this._materialAdv();
    const wb=document.getElementById('captured-by-white');
    const bb=document.getElementById('captured-by-black');
    if(wb) wb.textContent=this.capturedByWhite.map(p=>PIECE_SYMBOLS[p]).join('')+(mat>0?` +${mat}`:'');
    if(bb) bb.textContent=this.capturedByBlack.map(p=>PIECE_SYMBOLS[p]).join('')+(mat<0?` +${Math.abs(mat)}`:'');
  }
  _materialAdv(){let w=0,b=0;this.capturedByWhite.forEach(p=>w+=PIECE_VALUES[p.toLowerCase()]||0);this.capturedByBlack.forEach(p=>b+=PIECE_VALUES[p.toLowerCase()]||0);return w-b;}

  // ── MOVE LOG ──
  _logMove(text,wasWhite){
    this.moveList.push({text,wasWhite});
    const el=document.getElementById('move-list'); if(!el) return;
    const num=Math.ceil(this.moveList.length/2);
    if(!wasWhite){
      const row=document.createElement('div'); row.className='move-row';
      row.innerHTML=`<span class="m-idx">${num}.</span><span class="m-w">${text}</span><span class="m-b"></span>`;
      el.appendChild(row);
    } else {
      const rows=el.querySelectorAll('.move-row'),last=rows[rows.length-1];
      if(last) last.querySelector('.m-b').textContent=text;
    }
    el.scrollTop=el.scrollHeight;
  }
  _trimMoveList(steps){
    for(let i=0;i<steps;i++) this.moveList.pop();
    const el=document.getElementById('move-list'); if(!el) return;
    el.innerHTML=''; const tmp=this.moveList.slice(); this.moveList=[];
    tmp.forEach(({text,wasWhite})=>this._logMove(text,wasWhite));
  }

  // ── STATUS ──
  _updateStatus(msg,type=''){
    const el=document.getElementById('status-banner'); if(!el) return;
    el.textContent=msg; el.className=`status-banner${type?' '+type:''}`;
  }

  // ── OVERLAYS ──
  _overlay(name,show){const el=document.getElementById(name+'-overlay');if(el)el.classList.toggle('visible',!!show);}
  _showGameOver(title,sub){
    const t=document.getElementById('gameover-title'),s=document.getElementById('gameover-sub');
    if(t)t.textContent=title; if(s)s.textContent=sub; this._overlay('gameover',true);
  }
  _showPromoPicker(){
    const row=document.getElementById('promo-row');
    if(!row){this._autoPromote();return;}
    row.innerHTML='';
    const w=this.pendingPromotion.white;
    (w?['Q','R','B','N']:['q','r','b','n']).forEach(pc=>{
      const div=document.createElement('div'); div.className='promo-piece';
      div.textContent=PIECE_SYMBOLS[pc];
      div.onclick=()=>{
        this._overlay('promo',false);
        const{fr,fc,tr,tc}=this.pendingPromotion;
        this.lastMoveCoords={fr,fc,tr,tc};
        this.pendingPromotion=null;
        sfx('promotion');
        this.commitMove(fr,fc,tr,tc,'promotion',pc);
      };
      row.appendChild(div);
    });
    this._overlay('promo',true);
  }
  _autoPromote(){
    if(!this.pendingPromotion) return;
    const{fr,fc,tr,tc,white}=this.pendingPromotion;
    this.lastMoveCoords={fr,fc,tr,tc};
    this.pendingPromotion=null;
    this.commitMove(fr,fc,tr,tc,'promotion',white?'Q':'q');
  }

  // ── STATE (online sync) ──
  getState(){
    return{board:this.board,turn:this.turn,castleRights:this.castleRights,enPassant:this.enPassant,capturedByWhite:this.capturedByWhite,capturedByBlack:this.capturedByBlack,clocks:this.clocks,gameOver:this.gameOver,lastMoveCoords:this.lastMoveCoords,moveList:this.moveList,updatedAt:Date.now()};
  }
  applyState(state){
    if(!state) return;
    this.board=state.board||this.board; this.turn=state.turn||'white';
    this.castleRights=state.castleRights||{wK:true,wQ:true,bK:true,bQ:true};
    this.enPassant=state.enPassant||null; this.capturedByWhite=state.capturedByWhite||[];
    this.capturedByBlack=state.capturedByBlack||[]; this.clocks=state.clocks||this.clocks;
    this.gameOver=!!state.gameOver; this.lastMoveCoords=state.lastMoveCoords||null;
    this.moveList=state.moveList||[]; this.selected=null; this.validMoves=[]; this.pendingPromotion=null;
    this._overlay('promo',false);
    if(this.gameOver) this._stopClock(); else this._startClock();
    this._rebuildMoveListDOM(); this._updateCapturedDisplay(); this._updateClockDisplay(); this.render();
    if(!this.gameOver){const inChk=isInCheck(this.turn==='white',this.board,this.enPassant,this.castleRights);this._updateStatus(inChk?(this.turn==='white'?'White':'Black')+' is in check!':(this.turn==='white'?'White':'Black')+' to move',inChk?'check':'');}
  }
  _rebuildMoveListDOM(){const el=document.getElementById('move-list');if(!el)return;el.innerHTML='';const tmp=this.moveList.slice();this.moveList=[];tmp.forEach(({text,wasWhite})=>this._logMove(text,wasWhite));}

  destroy(){this._stopClock();}
}