const dictionary = [
    "APPLE", "TRAIN", "HOUSE", "MOUSE", "BREAD", "PLANT", "WATER", "LIGHT",
    "HEART", "MUSIC", "NIGHT", "DREAM", "WORLD", "SMILE", "PEACE", "GHOST",
    "ALIEN", "ROBOT", "MAGIC", "POWER", "BEACH", "OCEAN", "RIVER", "MOUNT",
    "STARS", "CLOUD", "STORM", "FLAME", "STONE", "GLASS", "METAL", "PAPER",
    "PAINT", "BRUSH", "TIGER", "EAGLE", "SNAKE", "SHARK", "WHALE", "BEARS",
    "CHAIR", "TABLE", "CLOCK", "PHONE", "RADIO", "VIDEO", "PHOTO", "FRAME",
    "ROUND", "SQUARE", "BLOCK", "CRAZY", "HAPPY", "BRAVE", "SMART", "QUICK",
    "SWEET", "CLEAN", "FRESH", "BROWN", "BLACK", "WHITE", "GREEN", "BLUES",
    "REACT", "VUEJS", "ANGEL", "DEMON", "DEVIL", "CRISP", "CANDY", "SUGAR"
];

let targetWord = "";
let currentGuess = "";
let guesses = [];
let gameOver = false;
let isAnimating = false;

const ROWS = 6;
const COLS = 5;

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const messageEl = document.getElementById("message");
const resetBtn = document.getElementById("reset-btn");

const KEYBOARD_LAYOUT = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
];

function initGame() {
    targetWord = dictionary[Math.floor(Math.random() * dictionary.length)].toUpperCase();
    currentGuess = "";
    guesses = [];
    gameOver = false;
    isAnimating = false;

    board.innerHTML = "";
    keyboard.innerHTML = "";
    messageEl.textContent = "";
    messageEl.className = "message";
    resetBtn.classList.add("hidden");

    // Initialize board
    for (let i = 0; i < ROWS * COLS; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.id = `tile-${i}`;
        board.appendChild(tile);
    }

    // Initialize keyboard
    KEYBOARD_LAYOUT.forEach(row => {
        const rowEl = document.createElement("div");
        rowEl.classList.add("keyboard-row");
        row.forEach(key => {
            const btn = document.createElement("button");
            btn.textContent = key === "BACKSPACE" ? "⌫" : key;
            btn.classList.add("key");
            btn.id = `key-${key}`;
            if (key === "ENTER" || key === "BACKSPACE") {
                btn.classList.add("large");
            }
            btn.addEventListener("click", () => handleKeyClick(key));
            rowEl.appendChild(btn);
        });
        keyboard.appendChild(rowEl);
    });
}

function showMessage(msg, isError = false) {
    messageEl.textContent = msg;
    messageEl.classList.add("show");

    if (isError) {
        messageEl.style.color = "#ff4a4a";
    } else {
        messageEl.style.color = "#fff";
    }

    setTimeout(() => {
        if (!gameOver || isError) {
            messageEl.classList.remove("show");
        }
    }, 2000);
}

function handleKeyClick(key) {
    if (gameOver || isAnimating) return;

    if (key === "BACKSPACE") {
        currentGuess = currentGuess.slice(0, -1);
        updateBoard();
        return;
    }

    if (key === "ENTER") {
        submitGuess();
        return;
    }

    if (currentGuess.length < COLS && /^[A-Z]$/.test(key)) {
        currentGuess += key;
        updateBoard();
    }
}

function updateBoard() {
    const startIdx = guesses.length * COLS;
    for (let i = 0; i < COLS; i++) {
        const tile = document.getElementById(`tile-${startIdx + i}`);
        if (tile) {
            tile.textContent = currentGuess[i] || "";
            if (currentGuess[i]) {
                tile.setAttribute("data-state", "active");
            } else {
                tile.removeAttribute("data-state");
            }
        }
    }
}

function shakeCurrentRow() {
    const startIdx = guesses.length * COLS;
    for (let i = 0; i < COLS; i++) {
        const tile = document.getElementById(`tile-${startIdx + i}`);
        if (tile) {
            tile.classList.remove("shake");
            void tile.offsetWidth; // trigger reflow
            tile.classList.add("shake");
        }
    }
}

function submitGuess() {
    if (currentGuess.length !== COLS) {
        showMessage("Not enough letters", true);
        shakeCurrentRow();
        return;
    }

    const guessArr = currentGuess.split("");
    const targetArr = targetWord.split("");
    const tileStates = new Array(COLS).fill("absent");

    const startIdx = guesses.length * COLS;

    // First pass: find correct letters
    for (let i = 0; i < COLS; i++) {
        if (guessArr[i] === targetArr[i]) {
            tileStates[i] = "correct";
            targetArr[i] = null; // Mark as used
        }
    }

    // Second pass: find present letters
    for (let i = 0; i < COLS; i++) {
        if (tileStates[i] === "correct") continue;

        const targetIndex = targetArr.indexOf(guessArr[i]);
        if (targetIndex !== -1) {
            tileStates[i] = "present";
            targetArr[targetIndex] = null; // Mark as used
        }
    }

    isAnimating = true;
    guesses.push(currentGuess);

    let animationsCompleted = 0;
    for (let i = 0; i < COLS; i++) {
        const tile = document.getElementById(`tile-${startIdx + i}`);
        setTimeout(() => {
            tile.setAttribute("data-state", tileStates[i]);
            updateKeyboardKey(guessArr[i], tileStates[i]);
            animationsCompleted++;

            if (animationsCompleted === COLS) {
                isAnimating = false;
                checkGameState();
            }
        }, i * 250);
    }
}

function updateKeyboardKey(letter, state) {
    const btn = document.getElementById(`key-${letter}`);
    if (!btn) return;

    const currentState = btn.getAttribute("data-state");

    // Precedence: correct > present > absent
    if (state === "correct") {
        btn.setAttribute("data-state", "correct");
    } else if (state === "present" && currentState !== "correct") {
        btn.setAttribute("data-state", "present");
    } else if (state === "absent" && currentState !== "correct" && currentState !== "present") {
        btn.setAttribute("data-state", "absent");
    }
}

function checkGameState() {
    const lastGuess = guesses[guesses.length - 1];

    if (lastGuess === targetWord) {
        gameOver = true;
        showMessage("Genius!", false);
        setTimeout(() => resetBtn.classList.remove("hidden"), 1000);
    } else if (guesses.length >= ROWS) {
        gameOver = true;
        showMessage(targetWord, false);
        setTimeout(() => resetBtn.classList.remove("hidden"), 1000);
    }
    currentGuess = "";
}

// Global key handler
document.addEventListener("keydown", (e) => {
    if (gameOver || isAnimating) return;

    let key = e.key.toUpperCase();

    // Prevent default scrolling for Space/Enter if needed, but here we just catch letters
    if (key === "ENTER" || key === "BACKSPACE") {
        handleKeyClick(key);
    } else if (/^[A-Z]$/.test(key) && key.length === 1) {
        handleKeyClick(key);
    }
});

resetBtn.addEventListener("click", initGame);

// Load game initially
initGame();
