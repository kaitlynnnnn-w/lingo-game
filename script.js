// ========================
// GAME STATE & INITIALIZATION
// ========================

const gameState = {
    teams: [],
    currentTeamIndex: 0,
    currentMode: null,
    currentRound: 1,
    scores: {},
    usedWords: [],
    usedEmojis: [],
    currentWord: '',
    currentRiddle: '',
    currentEmoji: '',
    guesses: 0,
    timer: null,
    timeLeft: 0,
    revealedLetters: 0,
    showHint: false,
    lastGuessCorrect: null
};

const elements = {
    setupScreen: document.getElementById('setup-screen'),
    nameEntryScreen: document.getElementById('name-entry-screen'),
    teamNameInputs: document.getElementById('team-name-inputs'),
    startGameBtn: document.getElementById('start-game-btn'),
    scoreBar: document.getElementById('score-bar'),
    introScreen: document.getElementById('intro-screen'),
    introContent: document.querySelector('.intro-content'),
    normalGameScreen: document.getElementById('normal-game-screen'),
    riddleGameScreen: document.getElementById('riddle-game-screen'),
    emojiGameScreen: document.getElementById('emoji-game-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    finalScores: document.getElementById('final-scores')
};

let normalWords = [];
let riddleWords = [];
let emojiRiddles = [];

// ========================
// INITIALIZATION
// ========================

function init() {
    fetch('words/normal.json')
        .then(response => response.json())
        .then(data => normalWords = data)
        .catch(() => normalWords = ["APPLE", "BEACH", "CRANE", "DANCE", "EAGLE"]);

    fetch('words/riddle.json')
        .then(response => response.json())
        .then(data => riddleWords = data)
        .catch(() => riddleWords = [
            { riddle: "I have keys but no locks...", answer: "keyboard" },
            { riddle: "This item moves but...", answer: "clock" }
        ]);

    fetch('words/emoji.json')
        .then(response => response.json())
        .then(data => emojiRiddles = data)
        .catch(() => emojiRiddles = [
            { emojis: "👻 💛", answer: "snapchat" },
            { emojis: "🍎 ⌚", answer: "apple watch" }
        ]);

    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.addEventListener('click', () => setupTeamNameEntry(parseInt(btn.dataset.teams)));
    });

    elements.startGameBtn.addEventListener('click', startGame);
    document.getElementById('play-again-btn').addEventListener('click', resetGame);
    document.getElementById('intro-continue-btn').addEventListener('click', startNextMode);
}

// ========================
// GAME FLOW CONTROL
// ========================

function setupTeamNameEntry(numTeams) {
    elements.setupScreen.classList.add('hidden');
    elements.nameEntryScreen.classList.remove('hidden');
    elements.teamNameInputs.innerHTML = '';

    for (let i = 1; i <= numTeams; i++) {
        const div = document.createElement('div');
        div.className = 'team-input';
        div.innerHTML = `
            <label>Team ${i} Name: </label>
            <input type="text" class="team-name-input" required>
        `;
        elements.teamNameInputs.appendChild(div);
    }
}

function startGame() {
    gameState.teams = Array.from(document.querySelectorAll('.team-name-input'))
        .map(input => input.value.trim() || `Team ${Math.random().toString(36).substring(2, 5)}`);

    gameState.teams.forEach(team => gameState.scores[team] = 0);
    gameState.usedWords = [];
    gameState.usedEmojis = [];
    updateScoreBar();
    elements.scoreBar.classList.remove('hidden');
    elements.nameEntryScreen.classList.add('hidden');
    gameState.currentMode = null;
    gameState.currentRound = 1;
    showModeIntro('normal');
}

function showModeIntro(mode) {
    elements.introScreen.classList.remove('hidden');
    let introText = '';
    let nextAction = '';

    switch(mode) {
        case 'normal':
            introText = `
                <h2>Normal Mode</h2>
                <p>Guess the 5-letter word in 6 attempts.</p>
                <div class="color-key">
                    <div><span class="correct">Green</span>: Correct letter & position</div>
                    <div><span class="present">Yellow</span>: Correct letter, wrong position</div>
                    <div><span class="absent">Gray</span>: Letter not in word</div>
                </div>
                <p>+50 points per correct guess</p>
            `;
            nextAction = 'Start Normal Mode';
            break;
            
        case 'riddle':
            introText = `
                <h2>Riddle Mode</h2>
                <p>Solve riddles with words (5-9 letters).</p>
                <p>Letters reveal every 7 seconds.</p>
                <p><strong>Scoring:</strong></p>
                <ul>
                    <li>Before letters: 200 points</li>
                    <li>After 1 letter: 150 points</li>
                    <li>After 2 letters: 100 points</li>
                    <li>3+ letters: 50 points</li>
                    <li>Wrong guess: -25 points</li>
                </ul>
            `;
            nextAction = 'Start Riddle Mode';
            break;
            
        case 'emoji':
            introText = `
                <h2>Emoji Riddle Mode</h2>
                <p>Guess the item represented by emojis!</p>
                <p><strong>Rules:</strong></p>
                <ul>
                    <li>Each team gets 2 rounds</li>
                    <li>3 guesses per emoji set</li>
                    <li>Correct guess: +100 points</li>
                    <li>Wrong guess: -10 points</li>
                </ul>
                <p>Example: 👻 💛 = "snapchat"</p>
            `;
            nextAction = 'Start Emoji Mode';
            break;
    }

    elements.introContent.innerHTML = introText;
    document.getElementById('intro-continue-btn').textContent = nextAction;
    
    // Reset button listener
    const continueBtn = document.getElementById('intro-continue-btn');
    continueBtn.replaceWith(continueBtn.cloneNode(true));
    document.getElementById('intro-continue-btn').addEventListener('click', startNextMode);
}

function startNextMode() {
    elements.introScreen.classList.add('hidden');
    
    // Mode order: Normal → Riddle → Emoji
    if (!gameState.currentMode) {
        gameState.currentMode = 'normal';
    } else if (gameState.currentMode === 'normal') {
        gameState.currentMode = 'riddle';
    } else if (gameState.currentMode === 'riddle') {
        gameState.currentMode = 'emoji';
    } else {
        endGame();
        return;
    }

    switch(gameState.currentMode) {
        case 'normal': setupNormalMode(); break;
        case 'riddle': setupRiddleMode(); break;
        case 'emoji': setupEmojiMode(); break;
    }
}

// ========================
// GAME MODES
// ========================

function setupNormalMode() {
    elements.normalGameScreen.classList.remove('hidden');
    const availableWords = normalWords.filter(word => !gameState.usedWords.includes(word));
    gameState.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)].toUpperCase();
    gameState.usedWords.push(gameState.currentWord);
    gameState.guesses = 0;

    elements.normalGameScreen.innerHTML = `
        <div class="current-team">Team: ${gameState.teams[gameState.currentTeamIndex]}</div>
        <div class="game-board"></div>
        <div class="input-area">
            <input type="text" class="word-input" maxlength="5" pattern="[A-Za-z]{5}" required>
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

    document.querySelector('.submit-btn').addEventListener('click', processNormalGuess);
    document.querySelector('.word-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processNormalGuess();
    });
}

function processNormalGuess() {
    const input = document.querySelector('.word-input');
    const guess = input.value.toUpperCase();
    if (guess.length !== 5) {
        showTemporaryMessage("Please enter a 5-letter word", "error");
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
        addGuessFeedback(true);
        setTimeout(() => endNormalRound(true), 1000);
    } else if (gameState.guesses >= 6) {
        addGuessFeedback(false);
        setTimeout(() => endNormalRound(false), 1000);
    }
}

function setupRiddleMode() {
    elements.riddleGameScreen.classList.remove('hidden');
    const riddle = riddleWords[Math.floor(Math.random() * riddleWords.length)];
    gameState.currentRiddle = riddle.riddle;
    gameState.currentWord = riddle.answer.toUpperCase();
    gameState.revealedLetters = 0;
    gameState.guesses = 0;

    elements.riddleGameScreen.innerHTML = `
        <div class="current-team">Team: ${gameState.teams[gameState.currentTeamIndex]}</div>
        <div class="riddle-container">
            <div class="riddle-text">${gameState.currentRiddle}</div>
            <div class="letter-reveal">${'_ '.repeat(gameState.currentWord.length).trim()}</div>
        </div>
        <div class="timer">60</div>
        <div class="input-area">
            <input type="text" class="word-input" required>
            <button class="submit-btn">Submit</button>
        </div>
    `;

    document.querySelector('.submit-btn').addEventListener('click', processRiddleGuess);
    document.querySelector('.word-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processRiddleGuess();
    });

    startTimer(60, () => endRiddleRound(false));
    gameState.letterInterval = setInterval(revealNextLetter, 7000);
}

function processRiddleGuess() {
    const input = document.querySelector('.word-input');
    const guess = input.value.toUpperCase();
    if (!guess) return;

    gameState.guesses++;
    const isCorrect = guess === gameState.currentWord;
    addGuessFeedback(isCorrect);

    if (isCorrect) {
        clearInterval(gameState.letterInterval);
        clearTimeout(gameState.timer);
        const lettersRevealed = document.querySelector('.letter-reveal').textContent.split('_').length - 1;
        let points = 0;
        
        if (lettersRevealed === 0) points = 200;
        else if (lettersRevealed === 1) points = 150;
        else if (lettersRevealed === 2) points = 100;
        else points = 50;
        
        gameState.scores[gameState.teams[gameState.currentTeamIndex]] += points;
        updateScoreBar();
        setTimeout(() => endRiddleRound(true), 1500);
    } else {
        gameState.scores[gameState.teams[gameState.currentTeamIndex]] -= 25;
        updateScoreBar();
        input.value = '';
    }
}

function setupEmojiMode() {
    elements.emojiGameScreen.classList.remove('hidden');
    const availableEmojis = emojiRiddles.filter(emoji => !gameState.usedEmojis.includes(emoji.emojis));
    const emojiRiddle = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
    gameState.currentEmoji = emojiRiddle.emojis;
    gameState.currentWord = emojiRiddle.answer.toLowerCase();
    gameState.usedEmojis.push(emojiRiddle.emojis);
    gameState.guesses = 0;

    elements.emojiGameScreen.innerHTML = `
        <div class="current-team">Team: ${gameState.teams[gameState.currentTeamIndex]}</div>
        <div class="emoji-container">${gameState.currentEmoji}</div>
        <div class="emoji-hint">What do these emojis represent?</div>
        <div class="input-area">
            <input type="text" class="word-input" required>
            <button class="submit-btn">Submit</button>
        </div>
    `;

    document.querySelector('.submit-btn').addEventListener('click', processEmojiGuess);
    document.querySelector('.word-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processEmojiGuess();
    });
}

function processEmojiGuess() {
    const input = document.querySelector('.word-input');
    const guess = input.value.trim().toLowerCase();
    if (!guess) return;

    gameState.guesses++;
    const isCorrect = guess === gameState.currentWord;
    addGuessFeedback(isCorrect);

    if (isCorrect) {
        gameState.scores[gameState.teams[gameState.currentTeamIndex]] += 100;
        updateScoreBar();
        setTimeout(() => endEmojiRound(true), 1500);
    } else {
        gameState.scores[gameState.teams[gameState.currentTeamIndex]] -= 10;
        updateScoreBar();
        input.value = '';
        
        if (gameState.guesses >= 3) {
            setTimeout(() => endEmojiRound(false), 1500);
        }
    }
}

// ========================
// GAME MODE ENDINGS
// ========================

function endNormalRound(success) {
    elements.normalGameScreen.classList.add('hidden');
    gameState.currentTeamIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
    gameState.currentRound++;

    if (gameState.currentRound > 5) {
        showModeIntro('riddle');
    } else {
        setupNormalMode();
    }
}

function endRiddleRound(success) {
    elements.riddleGameScreen.classList.add('hidden');
    gameState.currentTeamIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
    gameState.currentRound++;

    if (gameState.currentRound > 3) {
        showModeIntro('emoji');
    } else {
        setupRiddleMode();
    }
}

function endEmojiRound(success) {
    elements.emojiGameScreen.classList.add('hidden');
    gameState.currentTeamIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
    gameState.currentRound++;

    if (gameState.currentRound > (gameState.teams.length * 2)) {
        endGame();
    } else {
        setupEmojiMode();
    }
}

function endGame() {
    elements.gameOverScreen.classList.remove('hidden');
    let scoresHTML = '<h2>Final Scores</h2><ol>';
    const sortedTeams = [...gameState.teams].sort((a, b) => gameState.scores[b] - gameState.scores[a]);
    
    sortedTeams.forEach(team => {
        scoresHTML += `<li>${team}: ${gameState.scores[team]} points</li>`;
    });
    
    scoresHTML += '</ol>';
    elements.finalScores.innerHTML = scoresHTML;
}

// ========================
// UTILITY FUNCTIONS
// ========================

function updateScoreBar() {
    elements.scoreBar.innerHTML = gameState.teams.map((team, index) => `
        <div class="team-score ${index === gameState.currentTeamIndex ? 'selected' : ''}" 
             data-team="${index}">
            👥 ${team}: ${gameState.scores[team]}
        </div>
    `).join('');

    document.querySelectorAll('.team-score').forEach(teamEl => {
        teamEl.addEventListener('click', () => {
            if (gameState.currentMode === 'riddle' || gameState.currentMode === 'emoji') {
                clearTimeout(gameState.timer);
                if (gameState.letterInterval) clearInterval(gameState.letterInterval);
            }
            gameState.currentTeamIndex = parseInt(teamEl.dataset.team);
            updateScoreBar();
            showTemporaryMessage(`Switched to ${gameState.teams[gameState.currentTeamIndex]}`, "success");
        });
    });
}

function addGuessFeedback(isCorrect) {
    const feedback = document.createElement('span');
    feedback.className = `guess-feedback ${isCorrect ? 'correct-guess' : 'wrong-guess'}`;
    feedback.textContent = isCorrect ? '✓' : '✗';
    document.querySelector('.submit-btn').insertAdjacentElement('afterend', feedback);
    setTimeout(() => feedback.remove(), 2000);
}

function startTimer(seconds, callback) {
    clearTimeout(gameState.timer);
    gameState.timeLeft = seconds;
    const timerElement = document.querySelector('.timer');
    if (timerElement) timerElement.textContent = seconds;

    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        if (timerElement) timerElement.textContent = gameState.timeLeft;
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            callback();
        }
    }, 1000);
}

function revealNextLetter() {
    const display = document.querySelector('.letter-reveal');
    if (!display) return;

    const word = gameState.currentWord;
    const currentDisplay = display.textContent.split('');
    let revealedCount = 0;

    for (let i = 0; i < word.length; i++) {
        if (currentDisplay[i] === '_' && revealedCount < 1) {
            currentDisplay[i] = word[i];
            revealedCount++;
        }
    }

    display.textContent = currentDisplay.join(' ');
    gameState.revealedLetters += revealedCount;
}

function showTemporaryMessage(message, type) {
    const msg = document.createElement('div');
    msg.className = `temp-message ${type}`;
    msg.textContent = message;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.classList.add('fade-out');
        setTimeout(() => msg.remove(), 500);
    }, 2000);
}

function resetGame() {
    gameState.teams = [];
    gameState.currentTeamIndex = 0;
    gameState.currentMode = null;
    gameState.currentRound = 1;
    gameState.scores = {};
    gameState.usedWords = [];
    gameState.usedEmojis = [];
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    elements.setupScreen.classList.remove('hidden');
    elements.scoreBar.classList.add('hidden');
}

// Initialize the game
window.addEventListener('DOMContentLoaded', init);
