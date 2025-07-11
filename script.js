// Game State
const gameState = {
    mode: null,
    teams: [],
    currentTeamIndex: 0,
    scores: {},
    usedWords: [],
    usedEmojis: [],
    currentWord: '',
    currentEmoji: '',
    guesses: 0
};

// DOM Elements
const elements = {
    setupScreen: document.getElementById('setup-screen'),
    modeSelect: document.querySelector('.mode-select'),
    teamSelect: document.querySelector('.team-select'),
    nameEntryScreen: document.getElementById('name-entry-screen'),
    teamNameInputs: document.getElementById('team-name-inputs'),
    startGameBtn: document.getElementById('start-game-btn'),
    scoreBar: document.getElementById('score-bar'),
    normalGameScreen: document.getElementById('normal-game-screen'),
    emojiGameScreen: document.getElementById('emoji-game-screen')
};

// Word Databases
const normalWords = [
    "APPLE", "BEACH", "CRANE", "DANCE", "EAGLE",
    "FABLE", "GIANT", "HAPPY", "IGLOO", "JOLLY",
    "KOALA", "LEMON", "MANGO", "NOBLE", "OLIVE",
    "PEACH", "QUEEN", "RIVER", "SUNNY", "TIGER"
];

const emojiRiddles = [
    { emojis: "👻 💛", answer: "snapchat" },
    { emojis: "🍎 ⌚", answer: "apple watch" },
    { emojis: "📱 💥", answer: "iphone" },
    { emojis: "🐦 🔵", answer: "twitter" },
    { emojis: "📸 🎞️", answer: "instagram" },
    { emojis: "🍿 🎬", answer: "netflix" },
    { emojis: "🎵 🟢", answer: "spotify" },
    { emojis: "🛒 🏠", answer: "amazon" }
];

// Initialize Game
function init() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            gameState.mode = e.target.dataset.mode;
            elements.modeSelect.classList.add('hidden');
            elements.teamSelect.classList.remove('hidden');
        });
    });

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
    
    if (gameState.mode === 'normal') {
        setupNormalMode();
    } else {
        setupEmojiMode();
    }
}

// Normal Wordle Mode
function setupNormalMode() {
    elements.normalGameScreen.classList.remove('hidden');
    const availableWords = normalWords.filter(word => !gameState.usedWords.includes(word));
    gameState.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    gameState.usedWords.push(gameState.currentWord);
    gameState.guesses = 0;

    elements.normalGameScreen.innerHTML = `
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

    setupInputHandlers('normal');
}

// Emoji Riddle Mode
function setupEmojiMode() {
    elements.emojiGameScreen.classList.remove('hidden');
    const availableEmojis = emojiRiddles.filter(emoji => !gameState.usedEmojis.includes(emoji.emojis));
    const emojiRiddle = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
    gameState.currentEmoji = emojiRiddle.emojis;
    gameState.currentWord = emojiRiddle.answer.toLowerCase();
    gameState.usedEmojis.push(emojiRiddle.emojis);
    gameState.guesses = 0;

    elements.emojiGameScreen.innerHTML = `
        <div class="current-team">${gameState.teams[gameState.currentTeamIndex]}'s Turn</div>
        <div class="emoji-display">${gameState.currentEmoji}</div>
        <div class="input-area">
            <input type="text" class="word-input" required>
            <button class="submit-btn">Submit</button>
        </div>
    `;

    setupInputHandlers('emoji');
}

// Input Handlers
function setupInputHandlers(mode) {
    const input = document.querySelector('.word-input');
    const submitBtn = document.querySelector('.submit-btn');
    
    // Clear previous listeners
    const newInput = input.cloneNode(true);
    const newSubmitBtn = submitBtn.cloneNode(true);
    input.replaceWith(newInput);
    submitBtn.replaceWith(newSubmitBtn);
    
    // Add new listeners
    document.querySelector('.submit-btn').addEventListener('click', () => processGuess(mode));
    document.querySelector('.word-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processGuess(mode);
    });
    document.querySelector('.word-input').focus();
}

// Process Guess
function processGuess(mode) {
    const input = document.querySelector('.word-input');
    const guess = input.value.trim();
    
    if (!guess) {
        alert("Please enter your guess!");
        return;
    }

    gameState.guesses++;
    
    if (mode === 'normal') {
        const word = gameState.currentWord;
        const isCorrect = guess.toUpperCase() === word;
        
        const row = document.querySelector(`.word-row[data-guess="${gameState.guesses - 1}"]`);
        for (let i = 0; i < 5; i++) {
            const box = row.querySelector(`[data-position="${i}"]`);
            box.textContent = guess[i]?.toUpperCase() || '';
            if (guess[i]?.toUpperCase() === word[i]) {
                box.classList.add('correct');
            } else if (word.includes(guess[i]?.toUpperCase())) {
                box.classList.add('present');
            } else {
                box.classList.add('absent');
            }
        }

        if (isCorrect) {
            gameState.scores[gameState.teams[gameState.currentTeamIndex]] += 50;
            updateScoreBar();
            setTimeout(() => endRound(true), 1000);
        } else if (gameState.guesses >= 6) {
            setTimeout(() => endRound(false), 1000);
        }
    } else { // Emoji mode
        const isCorrect = guess.toLowerCase() === gameState.currentWord;
        
        if (isCorrect) {
            gameState.scores[gameState.teams[gameState.currentTeamIndex]] += 100;
            updateScoreBar();
            setTimeout(() => endRound(true), 1000);
        } else {
            gameState.scores[gameState.teams[gameState.currentTeamIndex]] -= 10;
            updateScoreBar();
            
            if (gameState.guesses >= 3) {
                setTimeout(() => endRound(false), 1000);
            }
        }
    }
    
    input.value = '';
}

// End Round
function endRound(success) {
    gameState.currentTeamIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
    
    if (gameState.mode === 'normal') {
        setupNormalMode();
    } else {
        setupEmojiMode();
    }
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
