// ======================
// CORE VARIABLES
// ======================
let score = 0;
let buttonCount = 0;
let buttons = [];
let purchasedItems = new Set();
let currentDragging = null;

// New Progress System Variables
let currentXP = 0;
let currentLevel = 1;
let currentStreak = 0;
let lastActivityDate = null;
let totalXPNeeded = 0;

// Level progression formula: XP needed for level n = 100 * n
const BASE_XP_PER_LEVEL = 100;

// Default store items
let storeItems = JSON.parse(localStorage.getItem('storeItems')) || [
    {
        id: 'theme1',
        name: '🌙 Dark Theme',
        description: 'Unlock a beautiful dark theme for your tracker',
        price: 100,
        color: '#2c3e50',
        type: 'theme',
        effect: () => {
            document.body.style.background = 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)';
            alert('Dark theme activated!');
        }
    },
    {
        id: 'theme2',
        name: '🌅 Sunrise Theme',
        description: 'Bright and cheerful sunrise theme',
        price: 150,
        color: '#fcb69f',
        type: 'theme',
        effect: () => {
            document.body.style.background = 'linear-gradient(135deg, #ffecd2, #fcb69f)';
            alert('Sunrise theme activated!');
        }
    },
    {
        id: 'boost1',
        name: '⚡ XP Boost',
        description: 'Gain 20% more XP for 1 hour',
        price: 200,
        color: '#f1c40f',
        type: 'boost',
        effect: () => {
            alert('XP Boost activated! You will gain 20% more XP for 1 hour!');
        }
    },
    {
        id: 'streak1',
        name: '🔥 Streak Freeze',
        description: 'Protect your streak for 1 day',
        price: 150,
        color: '#e74c3c',
        type: 'streak',
        effect: () => {
            alert('Streak Freeze activated! Your streak is protected for 1 day!');
        }
    }
];

// ======================
// INITIALIZATION
// ======================
window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateStreak();
    initStore();
    updateJsonTemplates();
    updateScoreDisplay();
    updateProgressDisplay();
    
    // Add demo buttons if none exist
    if (buttons.length === 0) {
        setTimeout(() => {
            createButton('good', 'Exercise 🏋️', 5);
            createButton('good', 'Meditation 🧘', 3);
            createButton('bad', 'Skip Workout 💤', -3);
            createButton('bad', 'Junk Food 🍔', -4);
        }, 1000);
    }
});

// ======================
// PROGRESS SYSTEM FUNCTIONS
// ======================
function updateProgressDisplay() {
    // Calculate XP needed for next level
    const xpForThisLevel = currentLevel * BASE_XP_PER_LEVEL;
    const xpForNextLevel = (currentLevel + 1) * BASE_XP_PER_LEVEL;
    const xpNeededForNextLevel = xpForNextLevel - currentXP;
    
    // Update progress bar
    const progressPercent = Math.min(100, (currentXP / xpForNextLevel) * 100);
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    document.getElementById('progressPercent').textContent = `${Math.round(progressPercent)}%`;
    
    // Update XP display
    document.getElementById('currentXP').textContent = currentXP;
    document.getElementById('nextLevelXP').textContent = xpForNextLevel;
    document.getElementById('xpNeeded').textContent = `${xpNeededForNextLevel} XP to next level`;
    
    // Update level display
    document.getElementById('levelNumber').textContent = currentLevel;
    document.getElementById('levelDisplay').textContent = currentLevel;
    document.getElementById('levelSummary').textContent = currentLevel;
    
    // Update streak display
    document.getElementById('streakDisplay').textContent = currentStreak;
    document.getElementById('streakSummary').textContent = currentStreak;
}

function addXP(amount) {
    // If score is negative, don't give XP
    if (amount < 0) return;
    
    const oldLevel = currentLevel;
    currentXP += amount;
    
    // Check for level up
    const xpNeededForNextLevel = (currentLevel + 1) * BASE_XP_PER_LEVEL;
    while (currentXP >= xpNeededForNextLevel) {
        currentLevel++;
        currentXP -= xpNeededForNextLevel;
        showLevelUpAnimation();
    }
    
    // Update streak if user was active today
    updateStreak();
    
    // Update display
    updateProgressDisplay();
    saveToLocalStorage();
    
    return oldLevel !== currentLevel; // Return true if leveled up
}

function showLevelUpAnimation() {
    // Add animation class to level display
    const levelDisplay = document.getElementById('levelDisplay');
    levelDisplay.classList.add('level-up');
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'level-notification';
    notification.innerHTML = `
        <div class="level-notification-content">
            <i class="fas fa-trophy"></i>
            <h3>Level Up!</h3>
            <p>You reached Level ${currentLevel}!</p>
            <button class="btn" onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    
    // Add some basic styles for the notification
    notification.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
    `;
    
    const content = notification.querySelector('.level-notification-content');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: levelUp 0.5s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove animation class after animation completes
    setTimeout(() => {
        levelDisplay.classList.remove('level-up');
    }, 500);
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

function updateStreak() {
    const today = new Date().toDateString();
    
    if (!lastActivityDate) {
        // First time user
        currentStreak = 1;
    } else {
        const lastDate = new Date(lastActivityDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === today) {
            // Already logged activity today, keep streak
            return;
        } else if (lastDate.toDateString() === yesterday.toDateString()) {
            // Consecutive day, increment streak
            currentStreak++;
        } else {
            // Streak broken, reset to 1
            currentStreak = 1;
        }
    }
    
    lastActivityDate = today;
    saveToLocalStorage();
}

function resetProgress() {
    if (confirm('Reset all progress (Level, XP, Streak)? This cannot be undone!')) {
        currentXP = 0;
        currentLevel = 1;
        currentStreak = 0;
        lastActivityDate = null;
        updateProgressDisplay();
        saveToLocalStorage();
        alert('Progress reset successfully!');
    }
}

// ======================
// SCORE FUNCTIONS
// ======================
function updateScore(value) {
    const oldScore = score;
    score += value;
    
    // Update display
    updateScoreDisplay();
    
    // Give XP for positive actions (good button clicks or +10)
    if (value > 0) {
        const xpGained = Math.floor(value / 2); // Half the points value as XP
        const leveledUp = addXP(xpGained);
        
        if (leveledUp) {
            // Level up bonus!
            score += 50; // Give bonus points for leveling up
            updateScoreDisplay();
        }
    }
    
    saveToLocalStorage();
}

function resetScore() {
    if (confirm('Reset score to 0?')) {
        score = 0;
        updateScoreDisplay();
        saveToLocalStorage();
    }
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById("score");
    const storeScoreElement = document.getElementById("storeScore");
    
    scoreElement.textContent = score;
    storeScoreElement.textContent = score;
    
    // Update color based on score
    scoreElement.className = 'score-value';
    if (score > 0) {
        scoreElement.classList.add('positive');
    } else if (score < 0) {
        scoreElement.classList.add('negative');
    } else {
        scoreElement.classList.add('neutral');
    }
    
    updateStoreButtons();
}

// ======================
// BUTTON FUNCTIONS
// ======================
function addButton(type) {
    const name = prompt(`Enter ${type} action name:`);
    if (!name) return;
    
    const valueInput = prompt(`Enter score value (positive number):`);
    let value = Number(valueInput);
    
    if (isNaN(value) || value === 0) {
        alert("Please enter a valid non-zero number!");
        return;
    }
    
    // Auto-convert based on type
    if (type === 'bad') {
        value = -Math.abs(value);
    } else {
        value = Math.abs(value);
    }
    
    createButton(type, name, value);
}

function createButton(type, name, value, id = null, left = null, top = null) {
    const btn = document.createElement("button");
    btn.classList.add("floating-button");
    btn.classList.add(type);
    
    if (!id) {
        buttonCount++;
        id = `btn-${buttonCount}`;
    }
    btn.id = id;
    
    // Auto-format display with +/- signs
    const displayValue = value > 0 ? `+${value}` : `${value}`;
    btn.textContent = `${name} (${displayValue})`;
    btn.setAttribute('data-value', value);
    btn.setAttribute('data-type', type);
    btn.setAttribute('data-name', name);
    
    // Click to update score
    btn.onclick = function (e) {
        if (e.detail === 2) return;
        updateScore(value);
        
        // Click animation
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 200);
    };
    
    // Right-click for context menu
    btn.oncontextmenu = function (e) {
        e.preventDefault();
        showContextMenu(e, btn);
        return false;
    };
    
    // Double-click to delete
    btn.ondblclick = function (e) {
        if (confirm(`Delete "${name}"?`)) {
            deleteButton(btn.id);
        }
    };
    
    const container = document.querySelector('.main-content');
    const containerRect = container.getBoundingClientRect();
    
    let leftPos, topPos;
    
    if (left !== null && top !== null) {
        leftPos = left;
        topPos = top;
    } else {
        // Random position on screen
        leftPos = 100 + Math.random() * (window.innerWidth - 400);
        topPos = 100 + Math.random() * (window.innerHeight - 300);
    }
    
    btn.style.left = `${leftPos}px`;
    btn.style.top = `${topPos}px`;
    
    buttons.push({
        id: btn.id,
        type: type,
        name: name,
        value: value,
        left: leftPos,
        top: topPos
    });
    
    makeDraggable(btn);
    document.body.appendChild(btn);
    
    saveToLocalStorage();
    return btn;
}

function deleteButton(id) {
    const btn = document.getElementById(id);
    if (btn) {
        btn.remove();
        buttons = buttons.filter(b => b.id !== id);
        saveToLocalStorage();
    }
}

function editButton(id) {
    const btn = document.getElementById(id);
    const buttonData = buttons.find(b => b.id === id);
    if (!buttonData) return;
    
    const name = prompt("Edit button name:", buttonData.name);
    if (!name) return;
    
    const value = Number(prompt("Edit score value:", Math.abs(buttonData.value)));
    if (isNaN(value)) {
        alert("Invalid number!");
        return;
    }
    
    const finalValue = buttonData.type === 'good' ? Math.abs(value) : -Math.abs(value);
    buttonData.name = name;
    buttonData.value = finalValue;
    
    const displayValue = finalValue > 0 ? `+${finalValue}` : `${finalValue}`;
    btn.textContent = `${name} (${displayValue})`;
    btn.setAttribute('data-value', finalValue);
    btn.setAttribute('data-name', name);
    
    btn.onclick = function (e) {
        if (e.detail === 2) return;
        updateScore(finalValue);
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 200);
    };
    
    saveToLocalStorage();
}

// ======================
// DRAGGABLE FUNCTION
// ======================
function makeDraggable(element) {
    let isDragging = false;
    let startX, startY;
    let initialX, initialY;
    
    element.addEventListener('mousedown', dragStart);
    
    function dragStart(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        
        isDragging = true;
        currentDragging = element;
        element.style.zIndex = '1000';
        element.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
        
        startX = e.clientX;
        startY = e.clientY;
        initialX = element.offsetLeft;
        initialY = element.offsetTop;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        element.style.left = `${initialX + dx}px`;
        element.style.top = `${initialY + dy}px`;
        
        const button = buttons.find(b => b.id === element.id);
        if (button) {
            button.left = initialX + dx;
            button.top = initialY + dy;
        }
        
        // Mixing zone feedback
        const rect = element.getBoundingClientRect();
        const mixingZoneStart = window.innerWidth * 0.4;
        const mixingZoneEnd = window.innerWidth * 0.6;
        
        const buttonCenter = rect.left + rect.width/2;
        
        if (buttonCenter > mixingZoneStart && buttonCenter < mixingZoneEnd) {
            element.style.opacity = '0.9';
            
            if (element.getAttribute('data-type') === 'good') {
                element.style.background = 'linear-gradient(135deg, #4CAF50, #f44336)';
            } else {
                element.style.background = 'linear-gradient(135deg, #f44336, #4CAF50)';
            }
        } else {
            element.style.opacity = '1';
            
            if (element.getAttribute('data-type') === 'good') {
                element.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
            } else {
                element.style.background = 'linear-gradient(135deg, #f44336, #C62828)';
            }
        }
    }
    
    function dragEnd() {
        if (!isDragging) return;
        
        isDragging = false;
        currentDragging = null;
        element.style.zIndex = '5';
        element.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
        
        saveToLocalStorage();
    }
}

// ======================
// CONTEXT MENU
// ======================
function showContextMenu(e, button) {
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editBtn.onclick = () => {
        editButton(button.id);
        menu.remove();
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
    deleteBtn.className = 'delete';
    deleteBtn.onclick = () => {
        if (confirm('Delete this button?')) {
            deleteButton(button.id);
        }
        menu.remove();
    };
    
    menu.appendChild(editBtn);
    menu.appendChild(deleteBtn);
    
    document.body.appendChild(menu);
    
    // Close menu when clicking elsewhere
    setTimeout(() => {
        const closeMenu = (clickEvent) => {
            if (!menu.contains(clickEvent.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 10);
}

// ======================
// STORE FUNCTIONS
// ======================
function toggleStore() {
    const storePanel = document.getElementById('storePanel');
    storePanel.classList.toggle('active');
}

function initStore() {
    const storeItemsContainer = document.getElementById('storeItems');
    storeItemsContainer.innerHTML = '';
    
    if (storeItems.length === 0) {
        storeItemsContainer.innerHTML = `
            <div class="empty-store">
                <i class="fas fa-store-slash fa-3x"></i>
                <h3>No Store Items</h3>
                <p>Add some items to your store or import them via JSON!</p>
                <button class="btn" onclick="addStoreItem()">
                    <i class="fas fa-plus"></i> Add First Item
                </button>
            </div>
        `;
        return;
    }
    
    storeItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'store-item';
        itemElement.innerHTML = `
            <div class="store-item-header">
                <div class="color-preview" style="background: ${item.color}"></div>
                <div class="store-item-title">${item.name}</div>
                <div class="item-price">${item.price} pts</div>
            </div>
            <div class="store-item-description">${item.description}</div>
            <div class="store-item-footer">
                <div class="item-type">${item.type}</div>
                <div class="store-item-actions">
                    ${item.id.startsWith('custom_') ? `
                        <button class="edit-store-btn" onclick="editStoreItem('${item.id}')">Edit</button>
                        <button class="delete-store-btn" onclick="deleteStoreItem('${item.id}')">Delete</button>
                    ` : ''}
                    <button class="buy-btn" onclick="buyItem('${item.id}')" 
                            ${purchasedItems.has(item.id) ? 'disabled' : ''}>
                        ${purchasedItems.has(item.id) ? '<i class="fas fa-check"></i> Purchased' : '<i class="fas fa-shopping-cart"></i> Buy'}
                    </button>
                </div>
            </div>
        `;
        storeItemsContainer.appendChild(itemElement);
    });
}

function addStoreItem() {
    const name = prompt("Enter item name:", "✨ New Item");
    if (!name) return;
    
    const description = prompt("Enter item description:", "A cool new item for your store");
    if (!description) return;
    
    const price = Number(prompt("Enter item price (points):", "100"));
    if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price!");
        return;
    }
    
    const color = prompt("Enter hex color (e.g., #3498db):", "#3498db");
    const type = prompt("Enter type (theme/boost/feature):", "feature");
    
    const newItem = {
        id: 'custom_' + Date.now(),
        name: name,
        description: description,
        price: price,
        color: color,
        type: type,
        effect: () => {
            alert(`Activated: ${name}!`);
        }
    };
    
    storeItems.push(newItem);
    saveStoreItems();
    initStore();
}

function editStoreItem(itemId) {
    const item = storeItems.find(i => i.id === itemId);
    if (!item) return;
    
    const name = prompt("Edit name:", item.name) || item.name;
    const description = prompt("Edit description:", item.description) || item.description;
    const price = Number(prompt("Edit price:", item.price));
    const color = prompt("Edit color:", item.color) || item.color;
    const type = prompt("Edit type:", item.type) || item.type;
    
    if (isNaN(price) || price <= 0) {
        alert("Invalid price!");
        return;
    }
    
    item.name = name;
    item.description = description;
    item.price = price;
    item.color = color;
    item.type = type;
    
    saveStoreItems();
    initStore();
}

function deleteStoreItem(itemId) {
    if (confirm("Delete this store item?")) {
        storeItems = storeItems.filter(item => item.id !== itemId);
        purchasedItems.delete(itemId);
        saveStoreItems();
        saveToLocalStorage();
        initStore();
    }
}

function buyItem(itemId) {
    const item = storeItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (score >= item.price) {
        if (confirm(`Buy "${item.name}" for ${item.price} points?\nYou will have ${score - item.price} points left.`)) {
            updateScore(-item.price);
            purchasedItems.add(itemId);
            item.effect();
            saveToLocalStorage();
            initStore();
        }
    } else {
        alert(`You need ${item.price - score} more points to buy this!`);
    }
}

function updateStoreButtons() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (!onclickAttr) return;
        
        const match = onclickAttr.match(/'([^']+)'/);
        if (!match) return;
        
        const itemId = match[1];
        const item = storeItems.find(i => i.id === itemId);
        if (!item) return;
        
        if (purchasedItems.has(itemId)) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-check"></i> Purchased';
        } else {
            btn.disabled = score < item.price;
        }
    });
}

function saveStoreItems() {
    localStorage.setItem('storeItems', JSON.stringify(storeItems));
}

function exportStoreItems() {
    const storeData = {
        storeItems: storeItems,
        purchasedItems: Array.from(purchasedItems),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(storeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ======================
// JSON IMPORT/EXPORT SYSTEM
// ======================
function openJsonModal() {
    document.getElementById('jsonModal').classList.add('active');
    updateJsonTemplates();
}

function closeJsonModal() {
    document.getElementById('jsonModal').classList.remove('active');
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function updateJsonTemplates() {
    // Buttons template
    const buttonsTemplate = {
        "buttons": [
            {
                "type": "good",
                "name": "Morning Run 🏃‍♂️",
                "value": 5
            },
            {
                "type": "good",
                "name": "Healthy Breakfast 🍎",
                "value": 3
            },
            {
                "type": "good",
                "name": "Read Book 📚",
                "value": 4
            },
            {
                "type": "bad",
                "name": "Skip Exercise 💤",
                "value": 4
            },
            {
                "type": "bad",
                "name": "Fast Food 🍟",
                "value": 3
            },
            {
                "type": "bad",
                "name": "Stay Up Late 🌙",
                "value": 5
            }
        ]
    };
    
    // Store items template
    const storeTemplate = {
        "storeItems": [
            {
                "id": "custom_" + Date.now(),
                "name": "🎨 Rainbow Theme",
                "description": "A colorful rainbow theme for your tracker",
                "price": 200,
                "color": "#FF6B6B",
                "type": "theme",
                "effect": "theme"
            },
            {
                "id": "custom_" + (Date.now() + 1),
                "name": "⚡ Energy Boost",
                "description": "Get an energy boost for your tasks",
                "price": 150,
                "color": "#FFD93D",
                "type": "boost",
                "effect": "boost"
            },
            {
                "id": "custom_" + (Date.now() + 2),
                "name": "🔔 Notifications",
                "description": "Enable desktop notifications",
                "price": 100,
                "color": "#6BCB77",
                "type": "feature",
                "effect": "feature"
            }
        ]
    };
    
    document.getElementById('buttonsTemplate').textContent = JSON.stringify(buttonsTemplate, null, 2);
    document.getElementById('storeTemplate').textContent = JSON.stringify(storeTemplate, null, 2);
}

function copyTemplate(type) {
    const template = type === 'buttons' ? 
        document.getElementById('buttonsTemplate').textContent :
        document.getElementById('storeTemplate').textContent;
    
    navigator.clipboard.writeText(template).then(() => {
        alert('✅ Template copied to clipboard!\n\nGive this to AI and ask it to fill with your content.');
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

function pasteTemplate(type) {
    const textarea = type === 'buttons' ? 
        document.getElementById('buttonsJson') :
        document.getElementById('storeJson');
    
    if (type === 'buttons') {
        textarea.value = `{
  "buttons": [
    {
      "type": "good",
      "name": "Morning Run 🏃‍♂️",
      "value": 6
    },
    {
      "type": "good",
      "name": "Healthy Breakfast 🍎",
      "value": 4
    },
    {
      "type": "bad",
      "name": "Skip Meditation",
      "value": 3
    },
    {
      "type": "bad",
      "name": "Procrastinate ⏰",
      "value": 5
    }
  ]
}`;
    } else {
        textarea.value = `{
  "storeItems": [
    {
      "id": "custom_" + Date.now(),
      "name": "🎨 Rainbow Theme",
      "description": "Colorful theme for your tracker",
      "price": 250,
      "color": "#FF6B6B",
      "type": "theme",
      "effect": "theme"
    },
    {
      "id": "custom_" + (Date.now() + 1),
      "name": "💎 Premium Features",
      "description": "Unlock premium customization",
      "price": 500,
      "color": "#3498db",
      "type": "feature",
      "effect": "feature"
    }
  ]
}`;
    }
}

function importButtonsFromJson() {
    const jsonText = document.getElementById('buttonsJson').value.trim();
    if (!jsonText) {
        alert('Please paste JSON first!');
        return;
    }
    
    try {
        const data = JSON.parse(jsonText);
        
        if (!data.buttons || !Array.isArray(data.buttons)) {
            throw new Error('Invalid format: JSON should have a "buttons" array');
        }
        
        let importedCount = 0;
        let skippedCount = 0;
        
        data.buttons.forEach(button => {
            if (button.type && button.name && button.value !== undefined) {
                createButton(button.type, button.name, 
                    button.type === 'bad' ? -Math.abs(button.value) : Math.abs(button.value));
                importedCount++;
            } else {
                skippedCount++;
            }
        });
        
        if (importedCount > 0) {
            alert(`✅ Successfully imported ${importedCount} buttons!${skippedCount > 0 ? ` (${skippedCount} skipped due to invalid format)` : ''}`);
            closeJsonModal();
        } else {
            alert('No valid buttons found in the JSON. Please check the format.');
        }
        
    } catch (error) {
        alert('❌ Error importing buttons:\n\n' + error.message + '\n\nPlease check your JSON format.');
    }
}

function importStoreFromJson() {
    const jsonText = document.getElementById('storeJson').value.trim();
    if (!jsonText) {
        alert('Please paste JSON first!');
        return;
    }
    
    try {
        const data = JSON.parse(jsonText);
        
        if (!data.storeItems || !Array.isArray(data.storeItems)) {
            throw new Error('Invalid format: JSON should have a "storeItems" array');
        }
        
        storeItems = data.storeItems;
        saveStoreItems();
        initStore();
        
        alert(`✅ Successfully imported ${data.storeItems.length} store items!`);
        closeJsonModal();
        
    } catch (error) {
        alert('❌ Error importing store items:\n\n' + error.message + '\n\nPlease check your JSON format.');
    }
}

// ======================
// DATA MANAGEMENT
// ======================
function clearAllButtons() {
    if (confirm('Clear all floating buttons? This cannot be undone.')) {
        document.querySelectorAll('.floating-button').forEach(btn => btn.remove());
        buttons = [];
        saveToLocalStorage();
        alert('All buttons cleared!');
    }
}

function clearAllData() {
    if (confirm('RESET ALL DATA?\n\nThis will reset:\n• Score to 0\n• All progress (Level, XP, Streak)\n• All floating buttons\n• Keep store items\n\nThis cannot be undone!')) {
        // Reset score
        score = 0;
        
        // Reset progress system
        currentXP = 0;
        currentLevel = 1;
        currentStreak = 0;
        lastActivityDate = null;
        
        // Clear all buttons
        document.querySelectorAll('.floating-button').forEach(btn => btn.remove());
        buttons = [];
        buttonCount = 0;
        
        // Update all displays
        updateScoreDisplay();
        updateProgressDisplay();
        saveToLocalStorage();
        
        alert('✅ All data reset successfully! Starting fresh!');
    }
}

function exportData() {
    const data = {
        score: score,
        buttons: buttons,
        purchasedItems: Array.from(purchasedItems),
        storeItems: storeItems,
        progress: {
            currentXP: currentXP,
            currentLevel: currentLevel,
            currentStreak: currentStreak,
            lastActivityDate: lastActivityDate
        },
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `score-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ All data exported successfully!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Clear existing buttons
                document.querySelectorAll('.floating-button').forEach(btn => btn.remove());
                buttons = [];
                
                // Import data
                score = data.score || 0;
                purchasedItems = new Set(data.purchasedItems || []);
                
                if (data.storeItems) {
                    storeItems = data.storeItems;
                    saveStoreItems();
                }
                
                // Import progress data if available
                if (data.progress) {
                    currentXP = data.progress.currentXP || 0;
                    currentLevel = data.progress.currentLevel || 1;
                    currentStreak = data.progress.currentStreak || 0;
                    lastActivityDate = data.progress.lastActivityDate || null;
                }
                
                // Create buttons from imported data
                if (data.buttons && Array.isArray(data.buttons)) {
                    data.buttons.forEach(buttonData => {
                        createButton(
                            buttonData.type,
                            buttonData.name,
                            buttonData.value,
                            buttonData.id,
                            buttonData.left,
                            buttonData.top
                        );
                    });
                }
                
                updateScoreDisplay();
                updateProgressDisplay();
                initStore();
                
                alert(`✅ Data imported successfully!\n\nScore: ${score}\nLevel: ${currentLevel}\nStreak: ${currentStreak} days\nButtons: ${buttons.length}\nStore Items: ${storeItems.length}`);
                
            } catch (error) {
                alert('❌ Error importing data:\n\n' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function saveToLocalStorage() {
    const data = {
        score: score,
        buttons: buttons,
        purchasedItems: Array.from(purchasedItems),
        progress: {
            currentXP: currentXP,
            currentLevel: currentLevel,
            currentStreak: currentStreak,
            lastActivityDate: lastActivityDate
        }
    };
    localStorage.setItem('scoreTrackerData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('scoreTrackerData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            score = data.score || 0;
            purchasedItems = new Set(data.purchasedItems || []);
            
            // Load progress data if available
            if (data.progress) {
                currentXP = data.progress.currentXP || 0;
                currentLevel = data.progress.currentLevel || 1;
                currentStreak = data.progress.currentStreak || 0;
                lastActivityDate = data.progress.lastActivityDate || null;
            }
            
            updateScoreDisplay();
            
            if (data.buttons && Array.isArray(data.buttons)) {
                data.buttons.forEach(buttonData => {
                    createButton(
                        buttonData.type,
                        buttonData.name,
                        buttonData.value,
                        buttonData.id,
                        buttonData.left,
                        buttonData.top
                    );
                });
            }
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// ======================
// HELP FUNCTION
// ======================
function showControlsHelp() {
    alert(`🎮 SCORE TRACKER CONTROLS:

🎯 SCORING:
• Click buttons to add/subtract points
• Use +/- 10 buttons for quick adjustments
• Score turns GREEN when positive, RED when negative

📈 PROGRESS SYSTEM:
• Gain XP for positive actions (½ of points as XP)
• Level up every 100 XP × current level
• Maintain daily streak for consecutive days
• Progress bar shows XP to next level

🛠️ BUTTON CONTROLS:
• Right-click buttons to edit or delete
• Double-click buttons to delete
• Drag buttons around the screen
• Buttons change color in the mixing zone

🏪 STORE:
• Buy items with your points
• Items can change themes or add features
• Manage store items with edit/delete

📁 DATA MANAGEMENT:
• Import/Export JSON for bulk operations
• Use templates with AI to generate content
• Full backup and restore available
• Reset all data with "Reset All Data" button

💡 TIP: Use the JSON Import system with AI to quickly create custom buttons and store items!`);
}