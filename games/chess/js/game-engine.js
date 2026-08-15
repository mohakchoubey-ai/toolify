// ============================================================
// CHESS ENGINE — Legal moves, AI (minimax + alpha-beta), helpers
// ============================================================
const PIECE_SYMBOLS = {
  'P':'♙','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔',
  'p':'♟','r':'♜','n':'♞','b':'♝','q':'♛','k':'♚'
};
const PIECE_VALUES = { p:100, n:320, b:330, r:500, q:900, k:0 };

// Piece-square tables (from white's perspective, row 0 = rank 8)
const PST = {
  p: [
    [ 0, 0, 0, 0, 0, 0, 0, 0],
    [50,50,50,50,50,50,50,50],
    [10,10,20,30,30,20,10,10],
    [ 5, 5,10,25,25,10, 5, 5],
    [ 0, 0, 0,20,20, 0, 0, 0],
    [ 5,-5,-10, 0, 0,-10,-5, 5],
    [ 5,10,10,-20,-20,10,10, 5],
    [ 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [ 0, 0, 0, 0, 0, 0, 0, 0],
    [ 5,10,10,10,10,10,10, 5],
    [-5, 0, 0, 0, 0, 0, 0,-5],
    [-5, 0, 0, 0, 0, 0, 0,-5],
    [-5, 0, 0, 0, 0, 0, 0,-5],
    [-5, 0, 0, 0, 0, 0, 0,-5],
    [-5, 0, 0, 0, 0, 0, 0,-5],
    [ 0, 0, 0, 5, 5, 0, 0, 0]
  ],
  q: [
    [-20,-10,-10,-5,-5,-10,-10,-20],
    [-10,  0,  0, 0, 0,  0,  0,-10],
    [-10,  0,  5, 5, 5,  5,  0,-10],
    [ -5,  0,  5, 5, 5,  5,  0, -5],
    [  0,  0,  5, 5, 5,  5,  0, -5],
    [-10,  5,  5, 5, 5,  5,  0,-10],
    [-10,  0,  5, 0, 0,  0,  0,-10],
    [-20,-10,-10,-5,-5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

function isWhitePiece(p) { return !!p && p === p.toUpperCase(); }

// ---- Move generation ----
// enPassant: {r,c} or null; castleRights: {wK,wQ,bK,bQ}
function pieceMoves(r, c, bd, attacksOnly, enPassant, castleRights) {
  const piece = bd[r][c]; if (!piece) return [];
  const white = isWhitePiece(piece); const type = piece.toLowerCase();
  const moves = [];
  const cr = castleRights || {wK:false,wQ:false,bK:false,bQ:false};

  const addMove = (nr, nc) => {
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
    const t = bd[nr][nc];
    if (!t) { moves.push({ r:nr, c:nc, special:'normal' }); return true; }
    if ((white && !isWhitePiece(t)) || (!white && isWhitePiece(t))) moves.push({ r:nr, c:nc, special:'capture' });
    return false;
  };

  if (type === 'p') {
    const dir = white ? -1 : 1, startRow = white ? 6 : 1, promoRow = white ? 0 : 7;
    if (!attacksOnly) {
      if (bd[r+dir] !== undefined && !bd[r+dir][c]) {
        moves.push({ r:r+dir, c, special: r+dir === promoRow ? 'promotion' : 'normal' });
        if (r === startRow && !bd[r+2*dir][c]) moves.push({ r:r+2*dir, c, special:'double' });
      }
    }
    [-1,1].forEach(dc => {
      const nr = r+dir, nc = c+dc;
      if (nr<0||nr>7||nc<0||nc>7) return;
      if (attacksOnly) { moves.push({ r:nr, c:nc, special:'attack' }); return; }
      const t = bd[nr][nc];
      if (t && ((white && !isWhitePiece(t)) || (!white && isWhitePiece(t))))
        moves.push({ r:nr, c:nc, special: nr===promoRow ? 'promotion':'capture' });
      else if (!t && enPassant && enPassant.r===nr && enPassant.c===nc)
        moves.push({ r:nr, c:nc, special:'enpassant' });
    });
  } else if (type === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => addMove(r+dr,c+dc));
  } else if (type === 'k') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => addMove(r+dr,c+dc));
    if (!attacksOnly) {
      const row = white ? 7 : 0;
      if (r===row && c===4) {
        const rK = white ? cr.wK : cr.bK, rQ = white ? cr.wQ : cr.bQ;
        const R = white ? 'R' : 'r';
        if (rK && !bd[row][5] && !bd[row][6] && bd[row][7]===R) {
          if (!isSquareAttacked(row,4,!white,bd,enPassant,cr) && !isSquareAttacked(row,5,!white,bd,enPassant,cr) && !isSquareAttacked(row,6,!white,bd,enPassant,cr))
            moves.push({ r:row, c:6, special:'castleK' });
        }
        if (rQ && !bd[row][1] && !bd[row][2] && !bd[row][3] && bd[row][0]===R) {
          if (!isSquareAttacked(row,4,!white,bd,enPassant,cr) && !isSquareAttacked(row,3,!white,bd,enPassant,cr) && !isSquareAttacked(row,2,!white,bd,enPassant,cr))
            moves.push({ r:row, c:2, special:'castleQ' });
        }
      }
    }
  } else {
    const dirs = type==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:type==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    dirs.forEach(([dr,dc]) => { let nr=r+dr,nc=c+dc; while(addMove(nr,nc)){nr+=dr;nc+=dc;} });
  }
  return moves;
}

function isSquareAttacked(r, c, byWhite, bd, enPassant, castleRights) {
  for (let rr=0;rr<8;rr++) for (let cc=0;cc<8;cc++) {
    const p=bd[rr][cc];
    if (p && isWhitePiece(p)===byWhite) {
      if (pieceMoves(rr,cc,bd,true,enPassant,castleRights).some(m=>m.r===r&&m.c===c)) return true;
    }
  }
  return false;
}

function findKing(white, bd) {
  const t = white ? 'K' : 'k';
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (bd[r][c]===t) return [r,c];
  return null;
}

function isInCheck(white, bd, enPassant, castleRights) {
  const k = findKing(white, bd);
  if (!k) return false;
  return isSquareAttacked(k[0],k[1],!white,bd,enPassant,castleRights);
}

function applyMoveToBoard(bd, fr, fc, tr, tc, special, promoPiece) {
  const piece = bd[fr][fc];
  const white = isWhitePiece(piece);
  bd[tr][tc] = piece; bd[fr][fc] = '';
  if (special==='enpassant') bd[fr][tc]='';
  if (special==='castleK') { bd[fr][5]=bd[fr][7]; bd[fr][7]=''; }
  if (special==='castleQ') { bd[fr][3]=bd[fr][0]; bd[fr][0]=''; }
  if (special==='promotion') bd[tr][tc] = promoPiece||(white?'Q':'q');
}

function getLegalMoves(r, c, bd, enPassant, castleRights) {
  const piece = bd[r][c]; if (!piece) return [];
  const white = isWhitePiece(piece);
  return pieceMoves(r,c,bd,false,enPassant,castleRights).filter(m => {
    const test = cloneBoard(bd);
    applyMoveToBoard(test, r, c, m.r, m.c, m.special);
    return !isInCheck(white, test, null, {wK:false,wQ:false,bK:false,bQ:false});
  });
}

function getAllLegalMoves(white, bd, enPassant, castleRights) {
  const moves = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p=bd[r][c];
    if (p && isWhitePiece(p)===white)
      getLegalMoves(r,c,bd,enPassant,castleRights).forEach(m => moves.push({from:[r,c],to:[m.r,m.c],special:m.special}));
  }
  return moves;
}

// ---- Evaluation ----
function evaluate(bd) {
  let score = 0;
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p = bd[r][c]; if (!p) continue;
    const type = p.toLowerCase();
    const val = PIECE_VALUES[type];
    const pstRow = isWhitePiece(p) ? r : 7-r;
    const pstVal = PST[type] ? PST[type][pstRow][c] : 0;
    score += isWhitePiece(p) ? (val+pstVal) : -(val+pstVal);
  }
  return score;
}

// ---- AI Minimax with Alpha-Beta ----
function searchLegal(white, bd) {
  const moves = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p=bd[r][c];
    if (p && isWhitePiece(p)===white) {
      pieceMoves(r,c,bd,false,null,{wK:false,wQ:false,bK:false,bQ:false}).forEach(m => {
        const sp = (m.special==='double'||m.special==='enpassant')?'normal':m.special;
        if (sp==='castleK'||sp==='castleQ') return;
        moves.push({from:[r,c],to:[m.r,m.c],special:sp});
      });
    }
  }
  return moves.filter(m => {
    const t=cloneBoard(bd); applyMoveToBoard(t,m.from[0],m.from[1],m.to[0],m.to[1],m.special);
    return !isInCheck(white,t,null,{wK:false,wQ:false,bK:false,bQ:false});
  });
}

function minimax(bd, depth, alpha, beta, maximizing) {
  if (depth===0) return evaluate(bd);
  const moves = searchLegal(maximizing, bd);
  if (!moves.length) return isInCheck(maximizing,bd,null,{wK:false,wQ:false,bK:false,bQ:false}) ? (maximizing?-100000-depth:100000+depth) : 0;

  // Move ordering: captures first
  moves.sort((a,b) => {
    const capB = bd[b.to[0]][b.to[1]] ? PIECE_VALUES[bd[b.to[0]][b.to[1]].toLowerCase()]||0 : 0;
    const capA = bd[a.to[0]][a.to[1]] ? PIECE_VALUES[bd[a.to[0]][a.to[1]].toLowerCase()]||0 : 0;
    return capB - capA;
  });

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const t=cloneBoard(bd); applyMoveToBoard(t,m.from[0],m.from[1],m.to[0],m.to[1],m.special);
      best = Math.max(best, minimax(t,depth-1,alpha,beta,false));
      alpha = Math.max(alpha,best); if (beta<=alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const t=cloneBoard(bd); applyMoveToBoard(t,m.from[0],m.from[1],m.to[0],m.to[1],m.special);
      best = Math.min(best, minimax(t,depth-1,alpha,beta,true));
      beta = Math.min(beta,best); if (beta<=alpha) break;
    }
    return best;
  }
}

function getBestMove(bd, difficulty, legalMoves) {
  if (!legalMoves.length) return null;
  if (difficulty===1) {
    // Easy: random with slight capture bias
    const caps = legalMoves.filter(m => bd[m.to[0]][m.to[1]]);
    const pool = (caps.length && Math.random()<0.5) ? caps : legalMoves;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  const depth = difficulty===2 ? 2 : difficulty===3 ? 3 : 4;
  let bestScore=Infinity, bestMoves=[];
  for (const mv of legalMoves) {
    const t=cloneBoard(bd); applyMoveToBoard(t,mv.from[0],mv.from[1],mv.to[0],mv.to[1],mv.special);
    const score = minimax(t,depth-1,-Infinity,Infinity,true);
    if (score<bestScore-0.5) { bestScore=score; bestMoves=[mv]; }
    else if (Math.abs(score-bestScore)<0.5) bestMoves.push(mv);
  }
  return bestMoves[Math.floor(Math.random()*bestMoves.length)];
}

// ---- Audio ----
function playAudio(filename) {
  try {
    const a = new Audio(filename);
    a.volume = 0.5;
    a.play().catch(()=>{});
  } catch(e) {}
}
function sfx(type) {
  if (type==='move'||type==='capture'||type==='check'||type==='castle') playAudio('assets/audio/move.mp3');
  else if (type==='mate') playAudio('assets/audio/mate.mp3');
}
