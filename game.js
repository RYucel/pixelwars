// Three.js Setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Pixel-Art Background
const textureLoader = new THREE.TextureLoader();
const cityTexture = textureLoader.load('assets/images/city-background.gif');
const cityMaterial = new THREE.MeshBasicMaterial({ map: cityTexture, transparent: true });
const cityGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
const cityBackground = new THREE.Mesh(cityGeometry, cityMaterial);
cityBackground.position.z = -10;
scene.add(cityBackground);

// Audio Setup
const bgMusic = document.getElementById("bg-music");
const countdownVoice = document.getElementById("countdown-voice");
const popSound = document.getElementById("pop-sound");
const cheersSound = document.getElementById("cheers-sound");
const loseSound = document.getElementById("lose-sound");
bgMusic.volume = 0.3;
countdownVoice.volume = 0.7;
popSound.volume = 0.5;
cheersSound.volume = 0.6;
loseSound.volume = 0.6;

// Game State
let playerParty = null;
let playerName = "";
let ubpScore = 0;
let ctpScore = 0;
let hitCount = 0;
const HIT_GOAL = 50;
let timeLeft = 60;
let gameActive = false;
let personSpeed = 2;
let countdownPlayed = false;

const hitCountDisplay = document.getElementById("hit-count");
const ubpScoreDisplay = document.getElementById("ubp-score");
const ctpScoreDisplay = document.getElementById("ctp-score");
const timerDisplay = document.getElementById("timer-display");
const nameInputScreen = document.getElementById("name-input");
const introScreen = document.getElementById("intro-screen");
const partySelect = document.getElementById("party-select");
const gameOverScreen = document.getElementById("game-over");
const highScoresDisplay = document.getElementById("high-scores");

// Persons, Voters, and Particles
const persons = [];
const voters = [];
const particles = [];
const voterGeometry = new THREE.BoxGeometry(20, 20, 20);
const particleGeometry = new THREE.SphereGeometry(5, 16, 16);

// Pixel-Art Textures
const ubpTexture = textureLoader.load('assets/images/ubp-person.gif');
const ctpTexture = textureLoader.load('assets/images/ctp-person.gif');
const wonTexture = textureLoader.load('assets/images/win-screen.png');
const lostTexture = textureLoader.load('assets/images/lose-screen.png');

let gameOverSprite = null;

// High Scores
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

// Create Persons
function createPerson(party) {
    const material = new THREE.MeshBasicMaterial({
        map: party === "UBP" ? ubpTexture : ctpTexture,
        transparent: true
    });
    const person = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), material);
    person.position.set(
        Math.random() * window.innerWidth - window.innerWidth / 2,
        Math.random() * window.innerHeight - window.innerHeight / 2,
        0
    );
    scene.add(person);
    persons.push({ mesh: person, party, velocity: new THREE.Vector2((Math.random() - 0.5) * personSpeed, (Math.random() - 0.5) * personSpeed) });
}

// Create Voters
function createVoter() {
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30 });
    const voter = new THREE.Mesh(voterGeometry, material);
    voter.position.set(
        Math.random() * window.innerWidth - window.innerWidth / 2,
        Math.random() * window.innerHeight - window.innerHeight / 2,
        0
    );
    scene.add(voter);
    voters.push({ mesh: voter, party: null });
}

// Create Particle Explosion
function createParticles(position, party) {
    const particleMaterial = new THREE.MeshBasicMaterial({ color: party === "UBP" ? 0xffa500 : 0x00ff00 });
    for (let i = 0; i < 20; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            0
        );
        particle.life = 1.0;
        scene.add(particle);
        particles.push(particle);
    }
    popSound.currentTime = 0;
    popSound.play();
}

// Name Input, Intro, and Party Selection
document.getElementById("start-btn").addEventListener("click", () => {
    playerName = document.getElementById("player-name").value.trim() || "Oyuncu";
    nameInputScreen.style.display = "none";
    introScreen.style.display = "block";
    bgMusic.play();
});

document.getElementById("continue-btn").addEventListener("click", () => {
    introScreen.style.display = "none";
    partySelect.style.display = "block";
});

document.getElementById("ubp-btn").addEventListener("click", () => startGame("UBP"));
document.getElementById("ctp-btn").addEventListener("click", () => startGame("CTP"));
document.getElementById("restart-btn").addEventListener("click", resetGame);

function startGame(party) {
    playerParty = party;
    partySelect.style.display = "none";
    gameActive = true;
    for (let i = 0; i < 10; i++) {
        createPerson("UBP");
        createPerson("CTP");
        createVoter();
    }
    camera.position.z = 500;
    startTimer();
}

function startTimer() {
    timerDisplay.style.display = "block";
    const timer = setInterval(() => {
        if (!gameActive) {
            clearInterval(timer);
            timerDisplay.style.display = "none";
            bgMusic.pause();
            return;
        }
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        personSpeed += 0.05;

        if (timeLeft === 3 && !countdownPlayed) {
            countdownVoice.currentTime = 0;
            countdownVoice.play();
            countdownPlayed = true;
        }

        if (timeLeft <= 10) {
            timerDisplay.style.color = "red";
            timerDisplay.style.transform = `translate(-50%, -50%) scale(${1 + Math.sin(Date.now() * 0.01) * 0.1})`;
        } else {
            timerDisplay.style.color = "white";
            timerDisplay.style.transform = "translate(-50%, -50%) scale(1)";
        }

        if (timeLeft <= 0) {
            endGame(hitCount < HIT_GOAL);
            clearInterval(timer);
            timerDisplay.style.display = "none";
            bgMusic.pause();
        }
    }, 1000);
}

// Raycaster for Clicking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener("click", (event) => {
    if (!gameActive) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(persons.map(p => p.mesh));

    if (intersects.length > 0) {
        const hitPerson = persons.find(p => p.mesh === intersects[0].object);
        if (hitPerson.party === playerParty) {
            endGame(true);
        } else {
            createParticles(hitPerson.mesh.position, hitPerson.party);
            scene.remove(hitPerson.mesh);
            persons.splice(persons.indexOf(hitPerson), 1);
            hitCount++;
            hitCountDisplay.textContent = hitCount;
            convertVoter();
            createPerson(hitPerson.party);
            if (hitCount >= HIT_GOAL) endGame(false);
        }
    }
});

function convertVoter() {
    const neutralVoter = voters.find(v => v.party === null);
    if (neutralVoter) {
        neutralVoter.party = playerParty;
        neutralVoter.mesh.material.color.set(playerParty === "UBP" ? 0xffa500 : 0x00ff00);
        if (playerParty === "UBP") ubpScore++;
        else ctpScore++;
        ubpScoreDisplay.textContent = ubpScore;
        ctpScoreDisplay.textContent = ctpScore;
    }
}

function endGame(lost = false) {
    gameActive = false;
    gameOverScreen.style.display = "block";
    bgMusic.pause();
    countdownVoice.pause();

    if (gameOverSprite) scene.remove(gameOverSprite);
    const endTexture = lost ? lostTexture : wonTexture;
    const endMaterial = new THREE.MeshBasicMaterial({ map: endTexture, transparent: true });
    gameOverSprite = new THREE.Mesh(new THREE.PlaneGeometry(256, 128), endMaterial);
    gameOverSprite.position.set(0, 50, 1);
    scene.add(gameOverSprite);

    highScores.push({ name: playerName, score: hitCount });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('highScores', JSON.stringify(highScores));
    highScoresDisplay.innerHTML = "En Yüksek Skorlar:<br>" + highScores.map((entry, i) => `${i + 1}. ${entry.name}: ${entry.score}`).join("<br>");

    if (lost) {
        loseSound.pause();
        loseSound.currentTime = 0;
        loseSound.play().catch(err => console.error('Lose Sound Error:', err));
    } else {
        cheersSound.pause();
        cheersSound.currentTime = 0;
        cheersSound.play().catch(err => console.error('Cheers Sound Error:', err));
    }
}

function resetGame() {
    gameOverScreen.style.display = "none";
    if (gameOverSprite) scene.remove(gameOverSprite);
    persons.forEach(p => scene.remove(p.mesh));
    voters.forEach(v => scene.remove(v.mesh));
    particles.forEach(p => scene.remove(p));
    persons.length = 0;
    voters.length = 0;
    particles.length = 0;
    ubpScore = 0;
    ctpScore = 0;
    hitCount = 0;
    timeLeft = 60;
    personSpeed = 2;
    countdownPlayed = false;
    hitCountDisplay.textContent = 0;
    ubpScoreDisplay.textContent = 0;
    ctpScoreDisplay.textContent = 0;
    timerDisplay.textContent = 60;
    timerDisplay.style.display = "block";
    nameInputScreen.style.display = "block";
    introScreen.style.display = "none";
    partySelect.style.display = "none";
    bgMusic.currentTime = 0;
    highScoresDisplay.innerHTML = "";
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    if (gameActive) {
        persons.forEach(p => {
            p.mesh.position.x += p.velocity.x;
            p.mesh.position.y += p.velocity.y;
            if (p.mesh.position.x > window.innerWidth / 2 || p.mesh.position.x < -window.innerWidth / 2) p.velocity.x *= -1;
            if (p.mesh.position.y > window.innerHeight / 2 || p.mesh.position.y < -window.innerHeight / 2) p.velocity.y *= -1;
        });

        voters.forEach(v => {
            v.mesh.rotation.y += 0.01;
            v.mesh.rotation.x += 0.01;
        });

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.position.add(p.velocity);
            p.life -= 0.02;
            p.scale.setScalar(p.life);
            if (p.life <= 0) {
                scene.remove(p);
                particles.splice(i, 1);
            }
        }
    }
    renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener("resize", () => {
    camera.left = -window.innerWidth / 2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = -window.innerHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cityBackground.scale.set(window.innerWidth / cityGeometry.parameters.width, window.innerHeight / cityGeometry.parameters.height, 1);
});