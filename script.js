document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GET ELEMENTS ---
    const testContainer = document.getElementById('test-container');
    const resultsContainer = document.getElementById('results-container');
    const questionTextElement = document.getElementById('question-text');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('question-palette');
    const overlay = document.getElementById('overlay');
    const timerElement = document.getElementById('timer');
    const questionNumberElement = document.getElementById('question-number');
    const optionsContainer = document.getElementById('options-container');
    const paletteGrid = document.getElementById('palette-grid');
    const saveNextBtn = document.getElementById('save-next-btn');
    const markReviewBtn = document.getElementById('mark-review-btn');
    const clearBtn = document.getElementById('clear-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // --- 2. DATA AND STATE ---
    let quizData = [];
    let currentQuestionIndex = 0;
    let reviewQuestionIndex = 0;
    let userAnswers = [];
    let questionStatus = [];
    let timerInterval;

    // --- 3. SIDEBAR LOGIC FOR MOBILE ---
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }
    menuToggleBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // --- 4. DATA LOADING ---
    async function loadQuizData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const testName = urlParams.get('test');
            if (!testName) {
                questionTextElement.textContent = "Error: No test selected. Please go back to the main menu.";
                return;
            }
            const response = await fetch(`tests/${testName}.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            quizData = data.map(item => ({
                question: item.question,
                options: [item.optionA, item.optionB, item.optionC, item.optionD],
                answer: item.answer
            }));
            
            userAnswers = new Array(quizData.length).fill(null);
            questionStatus = new Array(quizData.length).fill('not-answered');
            
            startQuiz();
        } catch (error) {
            console.error("Could not load quiz data:", error);
            questionTextElement.textContent = "Error: Could not load questions. Please make sure the JSON file exists in the 'tests' folder and is formatted correctly.";
        }
    }

    // --- 5. CORE QUIZ FUNCTIONS ---
    function startQuiz() {
        createQuestionPalette();
        loadQuestion(0);
        startTimer(90 * 60);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function loadQuestion(index) {
        if (sidebar.classList.contains('open')) {
            toggleSidebar();
        }
        currentQuestionIndex = index;
        const question = quizData[index];
        questionNumberElement.textContent = `${index + 1}`;
        questionTextElement.textContent = question.question;
        optionsContainer.innerHTML = '';

        let shuffledOptions = [...question.options];
        shuffleArray(shuffledOptions);

        shuffledOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            if (userAnswers[index] === option) {
                optionElement.classList.add('selected');
            }
            optionElement.addEventListener('click', () => selectOption(option, optionElement));
            optionsContainer.appendChild(optionElement);
        });
        updatePalette();
    }

    function selectOption(option, element) {
        document.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        userAnswers[currentQuestionIndex] = option;
    }

    function createQuestionPalette() {
        paletteGrid.innerHTML = ''; 
        quizData.forEach((_, index) => {
            const paletteBtn = document.createElement('button');
            paletteBtn.className = 'palette-btn not-answered';
            paletteBtn.textContent = index + 1;
            paletteBtn.addEventListener('click', () => loadQuestion(index));
            paletteGrid.appendChild(paletteBtn);
        });
    }

    function updatePalette() {
        const paletteButtons = paletteGrid.children;
        for (let i = 0; i < paletteButtons.length; i++) {
            paletteButtons[i].className = 'palette-btn';
            paletteButtons[i].classList.add(questionStatus[i]);
            if (i === currentQuestionIndex) {
                paletteButtons[i].classList.add('current');
            }
        }
    }

    function startTimer(duration) {
        let timer = duration;
        timerInterval = setInterval(() => {
            let minutes = parseInt(timer / 60, 10);
            let seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            timerElement.textContent = `Time Left: ${minutes}:${seconds}`;
            if (--timer < 0) {
                submitTest();
            }
        }, 1000);
    }
    
    // --- 6. NAVIGATION AND SUBMISSION ---
    function goToNextQuestion() {
        if (currentQuestionIndex < quizData.length - 1) {
            loadQuestion(currentQuestionIndex + 1);
        } else {
            alert("This is the last question. Please submit your test.");
        }
    }
    
    saveNextBtn.addEventListener('click', () => {
        if (userAnswers[currentQuestionIndex] !== null) {
            questionStatus[currentQuestionIndex] = 'answered';
        }
        goToNextQuestion();
    });

    markReviewBtn.addEventListener('click', () => {
        questionStatus[currentQuestionIndex] = 'marked';
        goToNextQuestion();
    });

    clearBtn.addEventListener('click', () => {
        userAnswers[currentQuestionIndex] = null;
        questionStatus[currentQuestionIndex] = 'not-answered';
        loadQuestion(currentQuestionIndex);
    });
    
    submitBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to submit the test?")) {
            submitTest();
        }
    });

    function submitTest() {
        clearInterval(timerInterval);
        testContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        displayResults();
    }
    
    // --- 7. RESULTS AND REVIEW FUNCTIONS ---
    function displayResults() {
        let correct = 0, incorrect = 0, unattempted = 0;
        quizData.forEach((_, i) => {
            if (userAnswers[i] === null) unattempted++;
            else if (userAnswers[i] === quizData[i].answer) correct++;
            else incorrect++;
        });
        
        const score = (correct * 4) - (incorrect * 1);
        const maxScore = quizData.length * 4;

        document.getElementById('total-questions-summary').textContent = quizData.length;
        document.getElementById('correct-summary').textContent = correct;
        document.getElementById('incorrect-summary').textContent = incorrect;
        document.getElementById('unattempted-summary').textContent = unattempted;
        document.getElementById('final-score').textContent = `${score} / ${maxScore}`;

        const reviewList = document.getElementById('review-question-list');
        reviewList.innerHTML = '';
        quizData.forEach((_, i) => {
            const item = document.createElement('div');
            item.className = 'review-item';
            let statusText = '';
            if (userAnswers[i] === null) {
                item.classList.add('review-item-unattempted');
                statusText = 'Unattempted';
            } else if (userAnswers[i] === quizData[i].answer) {
                item.classList.add('review-item-correct');
                statusText = 'Correct';
            } else {
                item.classList.add('review-item-incorrect');
                statusText = 'Incorrect';
            }
            item.innerHTML = `<span>Question ${i + 1}</span> <span>${statusText}</span>`;
            item.addEventListener('click', () => {
                document.querySelectorAll('.review-item.active').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                showReviewQuestion(i);
            });
            reviewList.appendChild(item);
        });
        
        if (reviewList.firstChild) {
            reviewList.firstChild.classList.add('active');
        }
        showReviewQuestion(0);
    }
    
    function showReviewQuestion(index) {
        reviewQuestionIndex = index;
        const question = quizData[index];
        const userAnswer = userAnswers[index];
        const detailView = document.getElementById('review-question-detail');
        let optionsHTML = '';

        question.options.forEach(option => {
            let class_name = 'review-option';
            if (option === question.answer) {
                class_name += ' review-option-correct';
            } else if (option === userAnswer) {
                class_name += ' review-option-incorrect';
            }
            optionsHTML += `<div class="${class_name}">${option}</div>`;
        });
        detailView.innerHTML = `<h4>Q ${index + 1}: ${question.question}</h4>${optionsHTML}<p><strong>Your Answer:</strong> ${userAnswer || 'Not Answered'}</p>`;
    }
    
    document.getElementById('prev-review-btn').addEventListener('click', () => {
        if (reviewQuestionIndex > 0) {
            document.querySelectorAll('.review-item')[reviewQuestionIndex - 1].click();
        }
    });
    
    document.getElementById('next-review-btn').addEventListener('click', () => {
        if (reviewQuestionIndex < quizData.length - 1) {
            document.querySelectorAll('.review-item')[reviewQuestionIndex + 1].click();
        }
    });

    // --- 8. START THE APP ---
    loadQuizData();
});