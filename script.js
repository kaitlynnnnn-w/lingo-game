// Game State
const gameState = {
    teams: [],
    currentTeamIndex: 0,
    scores: {},
    usedWords: [],
    currentWord: '',
    guesses: 0
};

// DOM Elements
const elements = {
    setupScreen: document.getElementById('setup-screen'),
    nameEntryScreen: document.getElementById('name-entry-screen'),
    teamNameInputs: document.getElementById('team-name-inputs'),
    startGameBtn: document.getElementById('start-game-btn'),
    scoreBar: document.getElementById('score-bar'),
    gameScreen: document.getElementById('game-screen')
};

// Word Database
const normalWords = [
    "APPLE", "BEACH", "CRANE", "DANCE", "EAGLE",
    "FABLE", "GIANT", "HAPPY", "IGLOO", "JOLLY",
    "KOALA", "LEMON", "MANGO", "NOBLE", "OLIVE",
    "PEACH", "QUEEN", "RIVER", "SUNNY", "TIGER"
];

// Initialize Game
function init() {
    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const numTeams = parseInt(btn.dataset.teams);
            setupTeamNameEntry(numTeams);
        });
    });
    
    elements.startGameBtn.addEventListener('click', startGame);
}

// Setup Team Names
function setupTeamNameEntry(numTeams) {
    elements.setupScreen.classList.add('hidden');
    elements.nameEntryScreen.classList.remove('hidden');
    elements.teamNameInputs.innerHTML = '';
    
    for (let i = 1; i <= numTeams; i++) {
        const div = document.createElement('div');
        div.className = 'team-input';
        div.innerHTML = `
            <label>${numTeams === 1 ? 'Your Name' : 'Team ' + i + ' Name'}: </label>
            <input type="text" class="team-name-input" required>
        `;
        elements.teamNameInputs.appendChild(div);
    }
}

// Start Game
function startGame() {
    gameState.teams = Array.from(document.querySelectorAll('.team-name-input'))
        .map(input => input.value.trim() || (gameState.teams.length > 1 ? `Team ${input.dataset.index}` : 'Player 1'));
    
    gameState.teams.forEach(team => gameState.scores[team] = 0);
    updateScoreBar();
    elements.scoreBar.classList.remove('hidden');
    elements.nameEntryScreen.classList.add('hidden');
    startNewRound();
}

// Start New Round
function startNewRound() {
    elements.gameScreen.classList.remove('hidden');
    const availableWords = normalWords.filter(word => !gameState.usedWords.includes(word));
    gameState.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    gameState.usedWords.push(gameState.currentWord);
    gameState.guesses = 0;

    elements.gameScreen.innerHTML = `
        <div class="current-team">${gameState.teams[gameState.currentTeamIndex]}'s Turn</div>
        <div class="game-board"></div>
        <div class="input-area">
            <input type="text" class="word-input" maxlength="5" required>
            <button class="submit-btn">Submit</button>
        </div>
    `;

    const board = document.querySelector('.game-board');
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'word-row';
        row.dataset.guess = i;
        for (let j = 0; j < 5; j++) {
            const box = document.createElement('div');
            box.className = 'letter-box';
            box.dataset.position = j;
            row.appendChild(box);
        }
        board.appendChild(row);
    }

    const input = document.querySelector('.word-input');
    const submitBtn = document.querySelector('.submit-btn');

    submitBtn.addEventListener('click', processGuess);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processGuess();
    });
    input.focus();
}

// Process Guess
function processGuess() {
    const input = document.querySelector('.word-input');
    const guess = input.value.toUpperCase();
    
    if (guess.length !== 5) {
        alert("Please enter a 5-letter word!");
        return;
    }

    const row = document.querySelector(`.word-row[data-guess="${gameState.guesses}"]`);
    const word = gameState.currentWord;

    for (let i = 0; i < 5; i++) {
        const box = row.querySelector(`[data-position="${i}"]`);
        box.textContent = guess[i];
        if (guess[i] === word[i]) {
            box.classList.add('correct');
        } else if (word.includes(guess[i])) {
            box.classList.add('present');
        } else {
            box.classList.add('absent');
        }
    }

    gameState.guesses++;
    input.value = '';

    if (guess === word) {
        gameState.scores[gameState.teams[gameState.currentTeamIndex]] += 50;
        updateScoreBar();
        setTimeout(() => endRound(true), 1000);
    } else if (gameState.guesses >= 6) {
        setTimeout(() => endRound(false), 1000);
    }
}

// End Round
function endRound(success) {
    gameState.currentTeamIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
    startNewRound();
}

// Update Score Bar
function updateScoreBar() {
    elements.scoreBar.innerHTML = gameState.teams.map((team, index) => `
        <div class="team-score ${index === gameState.currentTeamIndex ? 'current-turn' : ''}">
            ${team}: ${gameState.scores[team]}
        </div>
    `).join('');
}

// Initialize the game
window.addEventListener('DOMContentLoaded', init);
