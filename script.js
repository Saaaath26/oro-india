// CBSE Class 10 Preparation Platform - Oro India
// Global Variables
let currentUser = null;
let isAuthenticated = false;
let currentSubject = '';
let currentChapter = '';
let currentTest = null;
let userProgress = {};

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    updateUserInterface();
    
    // Initialize Google Sign-In after a short delay to ensure library is loaded
    setTimeout(initializeGoogleSignIn, 500);
});

// Authentication Management
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            isAuthenticated = true;
            await loadUserProgress();
            showUserProfile();
        } else {
            showAuthButtons();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthButtons();
    }
}

async function loadUserProgress() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/progress`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            userProgress = data.progress;
        }
    } catch (error) {
        console.error('Failed to load progress:', error);
    }
}

function showAuthButtons() {
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userProfile').style.display = 'none';
}

function showUserProfile() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userProfile').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.firstName || 'User';
    document.getElementById('userType').value = currentUser.role || 'student';
}

// Google Sign-In Integration
function initializeGoogleSignIn() {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: '574699898187-aupgiulfsf8ag6r092f33g6vucifof3h.apps.googleusercontent.com',
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        console.log('✅ Google Sign-In initialized successfully');
    } else {
        console.log('⏳ Google Sign-In library not loaded yet');
        // Retry after a short delay
        setTimeout(initializeGoogleSignIn, 1000);
    }
}

function signInWithGoogle() {
    if (typeof google !== 'undefined') {
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback to popup if prompt is not displayed
                google.accounts.id.renderButton(
                    document.createElement('div'),
                    { theme: 'outline', size: 'large' }
                );
            }
        });
    } else {
        showError('Google Sign-In is loading. Please try again in a moment.');
    }
}

function signUpWithGoogle() {
    signInWithGoogle(); // Same flow for sign up
}

async function handleGoogleSignIn(response) {
    try {
        console.log('Google Sign-In response received');
        
        // Send credential to backend for verification
        const backendResponse = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                credential: response.credential
            })
        });
        
        const data = await backendResponse.json();
        
        if (data.success) {
            currentUser = data.user;
            isAuthenticated = true;
            await loadUserProgress();
            
            closeLoginModal();
            closeRegisterModal();
            showUserProfile();
            showWelcomeMessage();
        } else {
            showError(data.error || 'Google authentication failed');
        }
    } catch (error) {
        console.error('Google Sign-In error:', error);
        showError('Google authentication failed. Please try again.');
    }
}

// Modal Management
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function switchToRegister() {
    closeLoginModal();
    showRegisterModal();
}

function switchToLogin() {
    closeRegisterModal();
    showLoginModal();
}

// Email Authentication
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, rememberMe })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            isAuthenticated = true;
            await loadUserProgress();
            
            closeLoginModal();
            showUserProfile();
            showWelcomeMessage();
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed. Please try again.');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('userRole').value;
    const schoolName = document.getElementById('schoolName')?.value || '';
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (!validatePassword(password)) {
        showError('Password must be at least 8 characters with uppercase, lowercase, and number');
        return;
    }
    
    try {
        // Send OTP first
        const otpResponse = await fetch(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const otpData = await otpResponse.json();
        
        if (otpData.success) {
            // Store registration data temporarily
            sessionStorage.setItem('registrationData', JSON.stringify({
                firstName, lastName, email, password, role, schoolName
            }));
            
            closeRegisterModal();
            showOtpModal(email);
            
            // Show development OTP notification
            showDevOtpNotification(email);
        } else {
            showError(otpData.error || 'Failed to send OTP');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Registration failed. Please try again.');
    }
}

// OTP Management
async function handleOtpVerification(event) {
    event.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showError('Please enter the complete 6-digit code');
        return;
    }
    
    try {
        const registrationData = JSON.parse(sessionStorage.getItem('registrationData'));
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                ...registrationData,
                otp
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            isAuthenticated = true;
            await loadUserProgress();
            
            closeOtpModal();
            showUserProfile();
            showWelcomeMessage();
            sessionStorage.removeItem('registrationData');
        } else {
            showError(data.error || 'Invalid OTP');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showError('Verification failed. Please try again.');
    }
}

async function resendOtp() {
    const email = document.getElementById('otpEmail').textContent;
    try {
        const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            startResendTimer();
            showSuccess('OTP resent successfully!');
            showDevOtpNotification(email);
        } else {
            showError(data.error || 'Failed to resend OTP');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        showError('Failed to resend OTP. Please try again.');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    currentUser = null;
    isAuthenticated = false;
    userProgress = {};
    showAuthButtons();
    
    // Remove any existing dropdown
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) dropdown.remove();
    
    showSuccess('You have been logged out successfully.');
}

// Utility Functions
function moveToNext(current, index) {
    if (current.value.length === 1 && index < 5) {
        document.querySelectorAll('.otp-input')[index + 1].focus();
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return minLength && hasUpper && hasLower && hasNumber;
}

function showError(message) {
    // Create and show error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showInfo(message) {
    // Create and show info notification
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-notification';
    infoDiv.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(infoDiv);
    
    setTimeout(() => {
        infoDiv.remove();
    }, 7000);
}

function showWelcomeMessage() {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'success-notification';
    welcomeDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Welcome to Oro India, ${currentUser.firstName}!</span>
    `;
    
    document.body.appendChild(welcomeDiv);
    
    setTimeout(() => {
        welcomeDiv.remove();
    }, 5000);
}

function showDevOtpNotification(email) {
    // Show a development notification to check console for OTP
    const devDiv = document.createElement('div');
    devDiv.className = 'dev-notification';
    devDiv.innerHTML = `
        <i class="fas fa-code"></i>
        <div>
            <strong>Development Mode</strong><br>
            <span>Fetching OTP for ${email}...</span>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">×</button>
    `;
    
    document.body.appendChild(devDiv);
    
    // Fetch the OTP from development endpoint
    setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/dev-otp/${encodeURIComponent(email)}`);
            const data = await response.json();
            
            if (data.success && !data.expired) {
                devDiv.innerHTML = `
                    <i class="fas fa-key"></i>
                    <div>
                        <strong>Development OTP</strong><br>
                        <span style="font-size: 1.2rem; font-weight: bold; color: #fff3cd;">${data.otp}</span><br>
                        <span style="font-size: 0.8rem;">Click to copy</span>
                    </div>
                    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">×</button>
                `;
                
                // Make it clickable to copy OTP
                devDiv.style.cursor = 'pointer';
                devDiv.onclick = (e) => {
                    if (e.target.tagName !== 'BUTTON') {
                        navigator.clipboard.writeText(data.otp).then(() => {
                            showSuccess('OTP copied to clipboard!');
                        });
                    }
                };
            }
        } catch (error) {
            console.error('Failed to fetch development OTP:', error);
        }
    }, 1000);
    
    setTimeout(() => {
        if (devDiv.parentElement) {
            devDiv.remove();
        }
    }, 15000);
}

// Simulated API Functions (replace with actual API calls)
async function simulateLogin(email, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, accept any email/password
    return {
        success: true,
        user: {
            id: Date.now(),
            email: email,
            firstName: email.split('@')[0],
            lastName: 'User',
            role: 'student',
            authMethod: 'email'
        }
    };
}

async function sendOTP(email) {
    // Simulate sending OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`OTP sent to ${email}: 123456`); // For demo
    return { success: true };
}

async function verifyOTPAndRegister(otp, userData) {
    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, accept any OTP
    return {
        success: true,
        user: {
            id: Date.now(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            authMethod: 'email'
        }
    };
}

function startResendTimer() {
    let timeLeft = 60;
    const timerElement = document.getElementById('resendTimer');
    
    const updateTimer = () => {
        if (timeLeft > 0) {
            timerElement.textContent = `Resend available in ${timeLeft}s`;
            timeLeft--;
            setTimeout(updateTimer, 1000);
        } else {
            timerElement.textContent = '';
        }
    };
    
    updateTimer();
}

async function resendOtp() {
    const email = document.getElementById('otpEmail').textContent;
    try {
        await sendOTP(email);
        startResendTimer();
        showError('OTP resent successfully!');
    } catch (error) {
        showError('Failed to resend OTP. Please try again.');
    }
}

// User Management
function changeUserType() {
    if (isAuthenticated && currentUser) {
        const userTypeSelect = document.getElementById('userType');
        currentUser.role = userTypeSelect.value;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserInterface();
    }
}

function showUserMenu() {
    // Create dropdown menu for user actions
    const existingMenu = document.querySelector('.user-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="dropdown-item" onclick="showProfile()">
            <i class="fas fa-user"></i>
            <span>Profile</span>
        </div>
        <div class="dropdown-item" onclick="showSettings()">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
        </div>
        <div class="dropdown-item" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
        </div>
    `;
    
    document.querySelector('.user-avatar').appendChild(dropdown);
}

function logout() {
    currentUser = null;
    isAuthenticated = false;
    localStorage.removeItem('currentUser');
    showAuthButtons();
    
    // Remove any existing dropdown
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) dropdown.remove();
    
    showError('You have been logged out successfully.');
}

function updateUserInterface() {
    // Update UI based on user type
    const userSpecificElements = document.querySelectorAll('[data-user-type]');
    userSpecificElements.forEach(element => {
        const allowedUsers = element.dataset.userType.split(',');
        if (allowedUsers.includes(currentUser)) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    });
}
// Navigation functions
function scrollToSubjects() {
    document.getElementById('subjects').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function showDemo() {
    alert('Demo feature coming soon! This will show a video walkthrough of the platform.');
}

// Subject modal functions
function openSubject(subjectId) {
    if (!isAuthenticated) {
        showLoginModal();
        showError('Please login to access learning materials');
        return;
    }
    
    currentSubject = subjectId;
    const modal = document.getElementById('subjectModal');
    const title = document.getElementById('modalSubjectTitle');
    const container = document.getElementById('chaptersContainer');
    
    title.textContent = subjectsData[subjectId].name + ' Chapters';
    container.innerHTML = '';
    
    // Load chapters
    const chapters = subjectsData[subjectId].chapters;
    Object.keys(chapters).forEach(chapterId => {
        const chapter = chapters[chapterId];
        const progress = userProgress[subjectId][chapterId];
        const currentLevelIndex = Object.keys(difficultyLevels).indexOf(progress.currentLevel);
        
        const chapterCard = document.createElement('div');
        chapterCard.className = 'chapter-card';
        chapterCard.onclick = () => openChapter(subjectId, chapterId);
        
        chapterCard.innerHTML = `
            <h3>${chapter.name}</h3>
            <p>${chapter.description}</p>
            <div class="chapter-progress">
                <span class="chapter-level level-${progress.currentLevel}">
                    Current: ${difficultyLevels[progress.currentLevel].name}
                </span>
                <span>${progress.completedLevels.length}/5 Levels</span>
            </div>
        `;
        
        container.appendChild(chapterCard);
    });
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('subjectModal').style.display = 'none';
}

// Chapter detail modal functions
function openChapter(subjectId, chapterId) {
    currentSubject = subjectId;
    currentChapter = chapterId;
    
    const modal = document.getElementById('chapterModal');
    const title = document.getElementById('chapterTitle');
    const summaryContainer = document.getElementById('chapterSummary');
    const levelsContainer = document.getElementById('difficultyLevels');
    
    const chapter = subjectsData[subjectId].chapters[chapterId];
    const progress = userProgress[subjectId][chapterId];
    
    title.textContent = chapter.name;
    
    // Generate AI summary
    generateChapterSummary(chapter, summaryContainer);
    
    // Load difficulty levels
    levelsContainer.innerHTML = '';
    Object.keys(difficultyLevels).forEach((levelId, index) => {
        const level = difficultyLevels[levelId];
        const isUnlocked = index === 0 || progress.completedLevels.includes(Object.keys(difficultyLevels)[index - 1]);
        const isCurrent = levelId === progress.currentLevel;
        const isCompleted = progress.completedLevels.includes(levelId);
        
        let cardClass = 'level-card';
        if (isCompleted) cardClass += ' unlocked';
        else if (isCurrent && isUnlocked) cardClass += ' current';
        else if (!isUnlocked) cardClass += ' locked';
        
        const levelCard = document.createElement('div');
        levelCard.className = cardClass;
        if (isUnlocked) {
            levelCard.onclick = () => startTest(subjectId, chapterId, levelId);
        }
        
        const bestScore = progress.bestScores[levelId] || 0;
        const attempts = Object.keys(progress.attempts[levelId] || {}).length;
        
        levelCard.innerHTML = `
            <div class="level-icon">${level.icon}</div>
            <h4>${level.name}</h4>
            <p>${level.description}</p>
            <div class="level-stats">
                <span>Best: ${bestScore}%</span>
                <span>Attempts: ${attempts}</span>
            </div>
        `;
        
        levelsContainer.appendChild(levelCard);
    });
    
    modal.style.display = 'block';
}

function closeChapterModal() {
    document.getElementById('chapterModal').style.display = 'none';
}

// AI Summary Generation with Groq API
async function generateChapterSummary(chapter, container) {
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Generating personalized summary with AI...
        </div>
    `;
    
    try {
        const summary = await callGroqAPI(chapter);
        container.innerHTML = `
            <div class="summary-text">
                <h4>🤖 AI-Generated Summary</h4>
                <div class="ai-summary-content">
                    ${summary}
                </div>
                <div class="ai-disclaimer">
                    <i class="fas fa-info-circle"></i>
                    <span>Generated by AI • Powered by Groq</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('AI Summary generation failed:', error);
        // Fallback to static summary
        const summary = generateDetailedSummary(chapter);
        container.innerHTML = `
            <div class="summary-text">
                <h4>📚 Chapter Overview</h4>
                <p>${summary.overview}</p>
                
                <h4>🎯 Key Concepts</h4>
                <ul>
                    ${summary.keyConcepts.map(concept => `<li>${concept}</li>`).join('')}
                </ul>
                
                <h4>💡 Important Points</h4>
                <ul>
                    ${summary.importantPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
                
                <h4>🔬 Real-world Applications</h4>
                <p>${summary.applications}</p>
            </div>
        `;
    }
}

async function callGroqAPI(chapter) {
    const prompt = `Generate a comprehensive summary for CBSE Class 10 chapter "${chapter.name}". 
    
    Include:
    1. A clear overview of the chapter
    2. 5-7 key concepts students must understand
    3. Important points for exam preparation
    4. Real-world applications and examples
    5. Tips for better understanding
    
    Format the response in HTML with proper headings and bullet points. Make it engaging and easy to understand for Class 10 students.
    
    Chapter Description: ${chapter.description}`;

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert CBSE Class 10 teacher who creates engaging and comprehensive chapter summaries. Always format your response in clean HTML.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function generateDetailedSummary(chapter) {
    // Enhanced summaries for each chapter
    const summaries = {
        'light': {
            overview: 'Light is a form of energy that enables us to see objects. This chapter explores how light behaves when it encounters different surfaces and materials, forming the foundation of optics.',
            keyConcepts: [
                'Reflection of light from plane and spherical mirrors',
                'Laws of reflection and mirror formula',
                'Refraction of light and Snell\'s law',
                'Total internal reflection and critical angle',
                'Lens formula and magnification'
            ],
            importantPoints: [
                'The angle of incidence equals the angle of reflection',
                'Light bends when passing from one medium to another',
                'Convex mirrors always form virtual, erect, and diminished images',
                'Concave lenses always form virtual, erect, and diminished images',
                'The human eye works like a camera with a convex lens'
            ],
            applications: 'Understanding light helps in designing optical instruments like telescopes, microscopes, cameras, and correcting vision problems with spectacles.'
        },
        'carbon-compounds': {
            overview: 'Carbon is unique in its ability to form long chains and complex structures, making it the basis of all organic compounds and life itself.',
            keyConcepts: [
                'Covalent bonding in carbon compounds',
                'Saturated and unsaturated hydrocarbons',
                'Functional groups and their properties',
                'Nomenclature of organic compounds',
                'Reactions of organic compounds'
            ],
            importantPoints: [
                'Carbon has valency 4 and forms covalent bonds',
                'Alkanes are saturated hydrocarbons with single bonds',
                'Alkenes and alkynes are unsaturated hydrocarbons',
                'Functional groups determine the properties of organic compounds',
                'Combustion of carbon compounds produces CO₂ and H₂O'
            ],
            applications: 'Carbon compounds are used in fuels, plastics, medicines, food additives, and form the basis of all biological molecules.'
        }
        // Add more summaries for other chapters...
    };
    
    return summaries[chapter.id] || {
        overview: chapter.summary,
        keyConcepts: ['Key concept 1', 'Key concept 2', 'Key concept 3'],
        importantPoints: ['Important point 1', 'Important point 2'],
        applications: 'Various real-world applications of this chapter.'
    };
}
// Test Management
function startTest(subjectId, chapterId, levelId) {
    if (!isAuthenticated) {
        showLoginModal();
        showError('Please login to take tests');
        return;
    }
    
    currentTest = {
        subject: subjectId,
        chapter: chapterId,
        level: levelId,
        questions: generateQuestions(subjectId, chapterId, levelId),
        currentQuestion: 0,
        answers: {},
        startTime: Date.now(),
        timeLimit: 15 * 60 * 1000 // 15 minutes
    };
    
    openTestModal();
    displayQuestion();
    startTimer();
}

function openTestModal() {
    const modal = document.getElementById('testModal');
    const title = document.getElementById('testTitle');
    
    const chapter = subjectsData[currentTest.subject].chapters[currentTest.chapter];
    const level = difficultyLevels[currentTest.level];
    
    title.textContent = `${chapter.name} - ${level.name} Level`;
    modal.style.display = 'block';
}

function closeTestModal() {
    if (currentTest && !currentTest.completed) {
        if (confirm('Are you sure you want to exit the test? Your progress will be lost.')) {
            document.getElementById('testModal').style.display = 'none';
            currentTest = null;
        }
    } else {
        document.getElementById('testModal').style.display = 'none';
        currentTest = null;
    }
}

function displayQuestion() {
    const container = document.getElementById('testContent');
    const question = currentTest.questions[currentTest.currentQuestion];
    const progress = document.getElementById('testProgress');
    
    progress.textContent = `${currentTest.currentQuestion + 1}/${currentTest.questions.length}`;
    
    container.innerHTML = `
        <div class="question-card">
            <div class="question-header">
                <span class="question-number">Question ${currentTest.currentQuestion + 1}</span>
            </div>
            <div class="question-text">${question.question}</div>
            <div class="options-grid">
                ${question.options.map((option, index) => `
                    <div class="option" onclick="selectOption(${index})" data-option="${index}">
                        <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                        <div class="option-text">${option}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="test-navigation">
            <button class="btn btn-secondary" onclick="previousQuestion()" ${currentTest.currentQuestion === 0 ? 'disabled' : ''}>
                <i class="fas fa-arrow-left"></i> Previous
            </button>
            <button class="btn btn-primary" onclick="nextQuestion()">
                ${currentTest.currentQuestion === currentTest.questions.length - 1 ? 'Finish Test' : 'Next'} 
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
    
    // Restore selected answer if exists
    const selectedAnswer = currentTest.answers[currentTest.currentQuestion];
    if (selectedAnswer !== undefined) {
        const option = container.querySelector(`[data-option="${selectedAnswer}"]`);
        if (option) option.classList.add('selected');
    }
}

function selectOption(optionIndex) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked option
    document.querySelector(`[data-option="${optionIndex}"]`).classList.add('selected');
    
    // Store answer
    currentTest.answers[currentTest.currentQuestion] = optionIndex;
}

function previousQuestion() {
    if (currentTest.currentQuestion > 0) {
        currentTest.currentQuestion--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentTest.currentQuestion < currentTest.questions.length - 1) {
        currentTest.currentQuestion++;
        displayQuestion();
    } else {
        finishTest();
    }
}

function startTimer() {
    const timerElement = document.getElementById('testTimer');
    
    const updateTimer = () => {
        if (!currentTest || currentTest.completed) return;
        
        const elapsed = Date.now() - currentTest.startTime;
        const remaining = Math.max(0, currentTest.timeLimit - elapsed);
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining === 0) {
            finishTest();
        } else {
            setTimeout(updateTimer, 1000);
        }
    };
    
    updateTimer();
}

function finishTest() {
    currentTest.completed = true;
    const score = calculateScore();
    const passed = score >= difficultyLevels[currentTest.level].passingScore;
    
    // Update progress
    updateProgress(score, passed);
    
    // Show results
    showTestResults(score, passed);
}

function calculateScore() {
    let correct = 0;
    currentTest.questions.forEach((question, index) => {
        if (currentTest.answers[index] === question.correctAnswer) {
            correct++;
        }
    });
    
    return Math.round((correct / currentTest.questions.length) * 100);
}

function updateProgress(score, passed) {
    const progress = userProgress[currentTest.subject][currentTest.chapter];
    const levelId = currentTest.level;
    
    // Initialize attempts for this level if not exists
    if (!progress.attempts[levelId]) {
        progress.attempts[levelId] = {};
    }
    
    // Record this attempt
    const attemptId = Date.now().toString();
    progress.attempts[levelId][attemptId] = {
        score: score,
        timestamp: Date.now(),
        passed: passed
    };
    
    // Update best score
    if (!progress.bestScores[levelId] || score > progress.bestScores[levelId]) {
        progress.bestScores[levelId] = score;
    }
    
    // If passed and not already completed, mark as completed and unlock next level
    if (passed && !progress.completedLevels.includes(levelId)) {
        progress.completedLevels.push(levelId);
        
        // Unlock next level
        const levels = Object.keys(difficultyLevels);
        const currentIndex = levels.indexOf(levelId);
        if (currentIndex < levels.length - 1) {
            progress.currentLevel = levels[currentIndex + 1];
        }
    }
    
    saveProgress();
}

function showTestResults(score, passed) {
    const container = document.getElementById('testContent');
    const level = difficultyLevels[currentTest.level];
    
    let message, messageClass, nextAction;
    
    if (passed) {
        message = `Congratulations! You've mastered the ${level.name} level!`;
        messageClass = 'pass';
        
        const levels = Object.keys(difficultyLevels);
        const currentIndex = levels.indexOf(currentTest.level);
        if (currentIndex < levels.length - 1) {
            nextAction = `
                <button class="btn btn-primary" onclick="startTest('${currentTest.subject}', '${currentTest.chapter}', '${levels[currentIndex + 1]}')">
                    <i class="fas fa-arrow-up"></i> Try ${difficultyLevels[levels[currentIndex + 1]].name} Level
                </button>
            `;
        } else {
            nextAction = `
                <button class="btn btn-primary" onclick="closeTestModal(); openChapter('${currentTest.subject}', '${currentTest.chapter}')">
                    <i class="fas fa-trophy"></i> View Chapter Progress
                </button>
            `;
        }
    } else {
        message = `Keep practicing! You need ${level.passingScore}% to advance.`;
        messageClass = 'fail';
        nextAction = `
            <button class="btn btn-primary" onclick="startTest('${currentTest.subject}', '${currentTest.chapter}', '${currentTest.level}')">
                <i class="fas fa-redo"></i> Try Again
            </button>
        `;
    }
    
    container.innerHTML = `
        <div class="test-results">
            <div class="result-score">${score}%</div>
            <div class="result-message ${messageClass}">${message}</div>
            <div class="result-actions">
                ${nextAction}
                <button class="btn btn-secondary" onclick="closeTestModal(); openChapter('${currentTest.subject}', '${currentTest.chapter}')">
                    <i class="fas fa-arrow-left"></i> Back to Chapter
                </button>
            </div>
        </div>
    `;
}
// Question Database
const questionDatabase = {
    science: {
        light: {
            foundation: [
                {
                    question: "What happens when light falls on a smooth surface?",
                    options: ["It gets absorbed", "It gets reflected", "It gets refracted", "It disappears"],
                    correctAnswer: 1
                },
                {
                    question: "Which type of mirror is used in car headlights?",
                    options: ["Plane mirror", "Concave mirror", "Convex mirror", "Cylindrical mirror"],
                    correctAnswer: 1
                },
                {
                    question: "What is the angle of incidence when a ray falls normally on a mirror?",
                    options: ["0°", "30°", "45°", "90°"],
                    correctAnswer: 0
                },
                {
                    question: "Which lens is thicker at the center than at the edges?",
                    options: ["Concave lens", "Convex lens", "Cylindrical lens", "Plane lens"],
                    correctAnswer: 1
                },
                {
                    question: "What type of image is formed by a plane mirror?",
                    options: ["Real and inverted", "Virtual and erect", "Real and erect", "Virtual and inverted"],
                    correctAnswer: 1
                }
            ],
            core: [
                {
                    question: "If the angle of incidence is 30°, what is the angle of reflection?",
                    options: ["15°", "30°", "60°", "90°"],
                    correctAnswer: 1
                },
                {
                    question: "Which mirror always forms a virtual, erect and diminished image?",
                    options: ["Plane mirror", "Concave mirror", "Convex mirror", "None of these"],
                    correctAnswer: 2
                },
                {
                    question: "What is the focal length of a plane mirror?",
                    options: ["Zero", "Infinity", "25 cm", "50 cm"],
                    correctAnswer: 1
                },
                {
                    question: "When light travels from air to water, it bends:",
                    options: ["Away from normal", "Towards normal", "Does not bend", "Bends at 90°"],
                    correctAnswer: 1
                },
                {
                    question: "The refractive index of water is 1.33. What does this mean?",
                    options: ["Light travels 1.33 times faster in water", "Light travels 1.33 times slower in water", "Water is 1.33 times denser", "None of these"],
                    correctAnswer: 1
                }
            ],
            advanced: [
                {
                    question: "A concave mirror has a focal length of 20 cm. If an object is placed 30 cm from the mirror, where will the image be formed?",
                    options: ["40 cm", "50 cm", "60 cm", "70 cm"],
                    correctAnswer: 2
                },
                {
                    question: "What is the critical angle for total internal reflection when light travels from glass (n=1.5) to air?",
                    options: ["30°", "42°", "48°", "60°"],
                    correctAnswer: 1
                },
                {
                    question: "A convex lens has a focal length of 15 cm. What is its power?",
                    options: ["6.67 D", "15 D", "0.067 D", "1.5 D"],
                    correctAnswer: 0
                },
                {
                    question: "Which phenomenon is responsible for the twinkling of stars?",
                    options: ["Reflection", "Refraction", "Dispersion", "Scattering"],
                    correctAnswer: 1
                },
                {
                    question: "The least distance of distinct vision for a normal human eye is:",
                    options: ["15 cm", "20 cm", "25 cm", "30 cm"],
                    correctAnswer: 2
                }
            ],
            expert: [
                {
                    question: "A ray of light incident at 60° on one face of an equilateral prism emerges at 40° from the other face. What is the angle of deviation?",
                    options: ["20°", "30°", "40°", "50°"],
                    correctAnswer: 1
                },
                {
                    question: "For a concave mirror, if the object distance is equal to the radius of curvature, the image formed is:",
                    options: ["At infinity", "At the center of curvature", "At the focus", "Between focus and center"],
                    correctAnswer: 1
                },
                {
                    question: "The magnification produced by a convex mirror is always:",
                    options: ["Greater than 1", "Less than 1", "Equal to 1", "Negative"],
                    correctAnswer: 1
                },
                {
                    question: "Which defect of vision is corrected using a cylindrical lens?",
                    options: ["Myopia", "Hypermetropia", "Astigmatism", "Presbyopia"],
                    correctAnswer: 2
                },
                {
                    question: "The phenomenon of dispersion of white light is due to:",
                    options: ["Different wavelengths have different refractive indices", "Reflection", "Absorption", "Scattering"],
                    correctAnswer: 0
                }
            ],
            master: [
                {
                    question: "A compound microscope has an objective lens of focal length 2 cm and eyepiece of focal length 5 cm. If the distance between lenses is 22 cm, what is the magnifying power for relaxed eye?",
                    options: ["50", "75", "100", "125"],
                    correctAnswer: 1
                },
                {
                    question: "In a Newton's ring experiment, the diameter of the 10th dark ring is 0.5 cm. What is the diameter of the 20th dark ring?",
                    options: ["0.707 cm", "1.0 cm", "1.414 cm", "2.0 cm"],
                    correctAnswer: 0
                },
                {
                    question: "A glass prism has a refracting angle of 60° and refractive index 1.5. What is the angle of minimum deviation?",
                    options: ["30°", "37°", "42°", "48°"],
                    correctAnswer: 1
                },
                {
                    question: "The resolving power of a telescope depends on:",
                    options: ["Focal length of objective", "Diameter of objective", "Focal length of eyepiece", "Magnifying power"],
                    correctAnswer: 1
                },
                {
                    question: "In fiber optic communication, which principle is used?",
                    options: ["Reflection", "Refraction", "Total internal reflection", "Dispersion"],
                    correctAnswer: 2
                }
            ]
        },
        'carbon-compounds': {
            foundation: [
                {
                    question: "What is the valency of carbon?",
                    options: ["2", "3", "4", "5"],
                    correctAnswer: 2
                },
                {
                    question: "Which type of bond is formed between carbon atoms?",
                    options: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"],
                    correctAnswer: 1
                },
                {
                    question: "What is the molecular formula of methane?",
                    options: ["CH₂", "CH₃", "CH₄", "C₂H₆"],
                    correctAnswer: 2
                },
                {
                    question: "Which gas is produced when carbon burns in sufficient oxygen?",
                    options: ["CO", "CO₂", "CH₄", "C₂H₂"],
                    correctAnswer: 1
                },
                {
                    question: "What is the simplest hydrocarbon?",
                    options: ["Ethane", "Propane", "Methane", "Butane"],
                    correctAnswer: 2
                }
            ],
            core: [
                {
                    question: "Which of the following is a saturated hydrocarbon?",
                    options: ["C₂H₄", "C₂H₂", "C₂H₆", "C₆H₆"],
                    correctAnswer: 2
                },
                {
                    question: "The functional group present in alcohols is:",
                    options: ["-OH", "-COOH", "-CHO", "-CO-"],
                    correctAnswer: 0
                },
                {
                    question: "What is the IUPAC name of CH₃CH₂OH?",
                    options: ["Methanol", "Ethanol", "Propanol", "Butanol"],
                    correctAnswer: 1
                },
                {
                    question: "Which process converts vegetable oils into solid fats?",
                    options: ["Oxidation", "Reduction", "Hydrogenation", "Dehydrogenation"],
                    correctAnswer: 2
                },
                {
                    question: "Soaps are sodium or potassium salts of:",
                    options: ["Carboxylic acids", "Long chain carboxylic acids", "Alcohols", "Esters"],
                    correctAnswer: 1
                }
            ],
            advanced: [
                {
                    question: "Which compound is formed when ethanol is oxidized with alkaline KMnO₄?",
                    options: ["Ethanoic acid", "Ethanal", "Ethyl ethanoate", "Ethane"],
                    correctAnswer: 0
                },
                {
                    question: "The molecular formula C₄H₁₀ represents how many isomers?",
                    options: ["1", "2", "3", "4"],
                    correctAnswer: 1
                },
                {
                    question: "Which catalyst is used in the hydrogenation of vegetable oils?",
                    options: ["Platinum", "Nickel", "Iron", "Copper"],
                    correctAnswer: 1
                },
                {
                    question: "What happens when ethanoic acid reacts with sodium carbonate?",
                    options: ["No reaction", "CO₂ is evolved", "H₂ is evolved", "O₂ is evolved"],
                    correctAnswer: 1
                },
                {
                    question: "The cleansing action of soap is due to:",
                    options: ["Emulsification", "Saponification", "Esterification", "Neutralization"],
                    correctAnswer: 0
                }
            ],
            expert: [
                {
                    question: "Which type of isomerism is shown by butanol?",
                    options: ["Chain isomerism", "Position isomerism", "Functional isomerism", "All of these"],
                    correctAnswer: 3
                },
                {
                    question: "The reaction between carboxylic acid and alcohol in presence of acid catalyst is called:",
                    options: ["Saponification", "Esterification", "Neutralization", "Hydrogenation"],
                    correctAnswer: 1
                },
                {
                    question: "Which compound is used as a preservative in pickles?",
                    options: ["Ethanoic acid", "Methanoic acid", "Propanoic acid", "Butanoic acid"],
                    correctAnswer: 0
                },
                {
                    question: "The carbon compounds having triple bond are called:",
                    options: ["Alkanes", "Alkenes", "Alkynes", "Aromatics"],
                    correctAnswer: 2
                },
                {
                    question: "Which property of carbon allows it to form long chains?",
                    options: ["Catenation", "Tetravalency", "Small size", "All of these"],
                    correctAnswer: 3
                }
            ],
            master: [
                {
                    question: "The number of sigma and pi bonds in ethyne (C₂H₂) are:",
                    options: ["3σ, 2π", "2σ, 3π", "4σ, 1π", "1σ, 4π"],
                    correctAnswer: 0
                },
                {
                    question: "Which mechanism is involved in the substitution reaction of alkanes?",
                    options: ["Free radical", "Electrophilic", "Nucleophilic", "Concerted"],
                    correctAnswer: 0
                },
                {
                    question: "The hybridization of carbon in diamond is:",
                    options: ["sp", "sp²", "sp³", "sp³d"],
                    correctAnswer: 2
                },
                {
                    question: "Which test is used to distinguish between saturated and unsaturated hydrocarbons?",
                    options: ["Bromine water test", "Litmus test", "Flame test", "Benedict's test"],
                    correctAnswer: 0
                },
                {
                    question: "The process of converting starch into glucose using enzymes is called:",
                    options: ["Hydrolysis", "Dehydration", "Fermentation", "Saponification"],
                    correctAnswer: 0
                }
            ]
        }
        // Add more subjects and chapters...
    },
    'social-science': {
        nationalism: {
            foundation: [
                {
                    question: "What does nationalism mean?",
                    options: ["Love for one's nation", "Hatred for other nations", "Economic development", "Political system"],
                    correctAnswer: 0
                },
                {
                    question: "Which revolution inspired nationalist movements in Europe?",
                    options: ["Industrial Revolution", "French Revolution", "Russian Revolution", "American Revolution"],
                    correctAnswer: 1
                },
                {
                    question: "Who was known as the 'Iron Chancellor' of Germany?",
                    options: ["Kaiser Wilhelm", "Otto von Bismarck", "Adolf Hitler", "Frederick the Great"],
                    correctAnswer: 1
                },
                {
                    question: "In which year was Germany unified?",
                    options: ["1861", "1871", "1881", "1891"],
                    correctAnswer: 1
                },
                {
                    question: "Which country was unified under the leadership of Giuseppe Garibaldi?",
                    options: ["Germany", "France", "Italy", "Austria"],
                    correctAnswer: 2
                }
            ],
            core: [
                {
                    question: "The concept of 'nation-state' means:",
                    options: ["A state with multiple nations", "A nation without a state", "A state representing one nation", "A federal structure"],
                    correctAnswer: 2
                },
                {
                    question: "Which treaty ended the Napoleonic Wars?",
                    options: ["Treaty of Paris", "Treaty of Vienna", "Treaty of Versailles", "Treaty of Berlin"],
                    correctAnswer: 1
                },
                {
                    question: "The Zollverein was:",
                    options: ["A political union", "A customs union", "A military alliance", "A cultural organization"],
                    correctAnswer: 1
                },
                {
                    question: "Who led the unification of Italy?",
                    options: ["Cavour, Garibaldi, and Mazzini", "Only Garibaldi", "Only Cavour", "Only Mazzini"],
                    correctAnswer: 0
                },
                {
                    question: "The Frankfurt Parliament was convened in:",
                    options: ["1848", "1849", "1850", "1851"],
                    correctAnswer: 0
                }
            ],
            advanced: [
                {
                    question: "The policy of 'Blood and Iron' was associated with:",
                    options: ["Italian unification", "German unification", "French expansion", "Austrian empire"],
                    correctAnswer: 1
                },
                {
                    question: "Which war led to the final unification of Germany?",
                    options: ["Austro-Prussian War", "Franco-Prussian War", "Seven Years War", "Thirty Years War"],
                    correctAnswer: 1
                },
                {
                    question: "The 'Risorgimento' refers to:",
                    options: ["German unification", "Italian unification", "French revolution", "Austrian empire"],
                    correctAnswer: 1
                },
                {
                    question: "Who was the architect of German unification?",
                    options: ["Kaiser Wilhelm I", "Otto von Bismarck", "Helmuth von Moltke", "Friedrich Engels"],
                    correctAnswer: 1
                },
                {
                    question: "The Battle of Sedan (1870) was significant because:",
                    options: ["It ended Austrian dominance", "It led to French defeat", "It unified Italy", "It started WWI"],
                    correctAnswer: 1
                }
            ],
            expert: [
                {
                    question: "The concept of 'Volksgeist' was promoted by:",
                    options: ["Johann Gottfried Herder", "Friedrich List", "Ernst Moritz Arndt", "All of these"],
                    correctAnswer: 3
                },
                {
                    question: "Which factor was most important in German unification?",
                    options: ["Economic integration", "Military strength", "Diplomatic skill", "All equally important"],
                    correctAnswer: 3
                },
                {
                    question: "The role of railways in nationalism was:",
                    options: ["Economic integration", "Cultural exchange", "Military mobility", "All of these"],
                    correctAnswer: 3
                },
                {
                    question: "The 'Eastern Question' in 19th century Europe referred to:",
                    options: ["German unification", "Italian unification", "Decline of Ottoman Empire", "Russian expansion"],
                    correctAnswer: 2
                },
                {
                    question: "Which ideology opposed nationalism in 19th century Europe?",
                    options: ["Liberalism", "Conservatism", "Socialism", "Both B and C"],
                    correctAnswer: 3
                }
            ],
            master: [
                {
                    question: "The impact of nationalism on the Habsburg Empire was:",
                    options: ["Strengthening", "Weakening", "No effect", "Temporary strengthening"],
                    correctAnswer: 1
                },
                {
                    question: "Which factor distinguished German nationalism from Italian nationalism?",
                    options: ["Economic development", "Military organization", "Cultural unity", "Geographic factors"],
                    correctAnswer: 1
                },
                {
                    question: "The role of intellectuals in nationalist movements was:",
                    options: ["Creating national consciousness", "Political leadership", "Military command", "Economic planning"],
                    correctAnswer: 0
                },
                {
                    question: "How did nationalism affect the balance of power in Europe?",
                    options: ["Maintained status quo", "Created new power centers", "Eliminated conflicts", "Strengthened old empires"],
                    correctAnswer: 1
                },
                {
                    question: "The long-term consequences of 19th century nationalism included:",
                    options: ["World wars", "Decolonization", "Cold war", "All of these"],
                    correctAnswer: 3
                }
            ]
        }
        // Add more social science chapters...
    }
};

// Question Generation Function
async function generateQuestions(subjectId, chapterId, levelId) {
    try {
        const response = await fetch(`${API_BASE_URL}/content/questions/${subjectId}/${chapterId}/${levelId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.questions;
        } else {
            throw new Error('Failed to fetch questions');
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
        return generateFallbackQuestions(subjectId, chapterId, levelId);
    }
}

function generateFallbackQuestions(subjectId, chapterId, levelId) {
    return [
        {
            question: `Sample question 1 for ${chapterId} at ${levelId} level`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0
        },
        {
            question: `Sample question 2 for ${chapterId} at ${levelId} level`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 1
        },
        {
            question: `Sample question 3 for ${chapterId} at ${levelId} level`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 2
        },
        {
            question: `Sample question 4 for ${chapterId} at ${levelId} level`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 3
        },
        {
            question: `Sample question 5 for ${chapterId} at ${levelId} level`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0
        }
    ];
}

// AI Summary Generation with Backend API
async function generateChapterSummary(chapter, container) {
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Generating personalized summary with AI...
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/ai/generate-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                chapterName: chapter.name,
                chapterDescription: chapter.description,
                subject: currentSubject
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            container.innerHTML = `
                <div class="summary-text">
                    <h4>🤖 AI-Generated Summary</h4>
                    <div class="ai-summary-content">
                        ${data.summary}
                    </div>
                    <div class="ai-disclaimer">
                        <i class="fas fa-info-circle"></i>
                        <span>${data.fallback ? 'Fallback Summary' : 'Generated by AI • Powered by Groq'}</span>
                    </div>
                </div>
            `;
        } else {
            throw new Error('AI summary generation failed');
        }
    } catch (error) {
        console.error('AI Summary generation failed:', error);
        // Fallback to static summary
        const summary = generateDetailedSummary(chapter);
        container.innerHTML = `
            <div class="summary-text">
                <h4>📚 Chapter Overview</h4>
                <p>${summary.overview}</p>
                
                <h4>🎯 Key Concepts</h4>
                <ul>
                    ${summary.keyConcepts.map(concept => `<li>${concept}</li>`).join('')}
                </ul>
                
                <h4>💡 Important Points</h4>
                <ul>
                    ${summary.importantPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
                
                <h4>🔬 Real-world Applications</h4>
                <p>${summary.applications}</p>
            </div>
        `;
    }
}

// Update progress with backend
async function updateProgress(score, passed) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                subject: currentTest.subject,
                chapter: currentTest.chapter,
                level: currentTest.level,
                score: score,
                passed: passed,
                timeElapsed: Date.now() - currentTest.startTime,
                answers: currentTest.answers
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reload user progress
            await loadUserProgress();
            return data;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Failed to update progress:', error);
        return { success: false };
    }
}

// Event Listeners
window.onclick = function(event) {
    const modals = ['subjectModal', 'chapterModal', 'testModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
            if (modalId === 'testModal' && currentTest && !currentTest.completed) {
                // Don't close test modal by clicking outside
                modal.style.display = 'block';
            }
        }
    });
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('CBSE Preparation Platform Loaded Successfully!');
    console.log('Available subjects:', Object.keys(subjectsData));
    console.log('User progress initialized:', userProgress);
});