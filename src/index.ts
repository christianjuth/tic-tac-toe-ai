// @ts-ignore
import { evaluate } from '../wasm'

type GameState = string[]

export const printBoard = (gameState: GameState) => {
  let line = '';
  for (let i = 1; i < 10; i++) {
    line += (gameState[i - 1] || ' ');
    if (i % 3 === 0) {
      if (i > 3) {
        console.log('---------')
      }
      console.log(line);
      line = '';
    } else {
      line += ' | '
    }
  }
}

export function checkWinner(gameState: GameState): "X" | "O" | "" | undefined {
  const winningCellCombinations = [
    // horizontal
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // vertical
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // diagnol
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (const combination of winningCellCombinations) {
    const string = combination.map((index) => gameState[index]).join("");
    if (/(X{3}|O{3})/.test(string)) {
      return string[0] as "X" | "O" | ""
    }
  }

  if (gameState.filter(cell => !cell).length === 0) {
    return "";
  }
  return;
}

export function whosMove(gameState: GameState) {
  return gameState.filter(Boolean).length % 2 === 0 ? 'X' : 'O'
}

export function getNextMoves(gameState: GameState) {
  if (checkWinner(gameState) !== undefined) {
    return []
  }

  const player = whosMove(gameState);
  const nextGameStates: GameState[] = []

  for (let i = 0; i < gameState.length; i++) {
    if (gameState[i] === '') {
      const newState = [...gameState];
      newState[i] = player;
      nextGameStates.push(newState);
    }
  }

  return nextGameStates
}

export function getBestMove(gameState: GameState) {
  const player = whosMove(gameState);
  const nextMoves = getNextMoves(gameState);

  const evaluations: [number, GameState][] = []
  let maxEval = -1000

  for (const move of nextMoves) {
    const evaluation = evaluate(...convertGameStateToNuralNetworkData(player, move))
    evaluations.push([evaluation, move])
    maxEval = Math.max(maxEval, evaluation)
  }

  for (const [evaluation, gameState] of evaluations) {
    if (evaluation === maxEval) {
      return gameState
    }
  }
}

function getIntRepresentationOfCell(player: string) {
  if (player === 'X') return 1;
  if (player === 'O') return -1;
  return 0;
}

export function predictWinner(gameState: GameState) {
  const winner = checkWinner(gameState)
  if (winner !== undefined) {
    return winner || undefined
  }

  const x = evaluate(...convertGameStateToNuralNetworkData('X', gameState))
  const o = evaluate(...convertGameStateToNuralNetworkData('O', gameState))
  console.log(x, o)

  if (Math.abs(x - o) > 0.2) {
    if ((x > 0 && o < 0) || (o > 0 || x < 0)) {
      return x > o ? 'X' : 'O'
    }
  }
}

/**
 * The nural network used to analize the board position accepts 
 * the data as an array of unmbers where X=1, O=-1, and empty=0.
 * The first argument passed into the network represents who's
 * perspective we are analyzing the position from, and the 
 * following 9 arguments each reprent a cell on the board.
 * 
 * @param gameState 
 * @returns data to be passed into nural network
 */
function convertGameStateToNuralNetworkData(player: string, gameState: GameState): number[] {
  const cells = gameState.map(getIntRepresentationOfCell)
  return [getIntRepresentationOfCell(player), ...cells]
}

export function checkPerformance() {
  let board = ['','','','','','','','','']

  const runtimes: number[] = []

  while (checkWinner(board) === undefined) {
    const t1 = performance.now()
    board = getBestMove(board) ?? []
    const t2 = performance.now()
    runtimes.push(t2 - t1)
  }

  return runtimes.reduce((a, b) => a + b) / runtimes.length;
}
