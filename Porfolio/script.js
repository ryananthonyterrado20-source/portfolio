// --- IMPORTS (Firebase lang ang i-import natin) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAHZaFAqxb4COeY8ZpQ02AKYPMMX2n9ZZo",
  authDomain: "myportfolio-2c0da.firebaseapp.com",
  projectId: "myportfolio-2c0da",
  storageBucket: "myportfolio-2c0da.firebasestorage.app",
  messagingSenderId: "911576506269",
  appId: "1:911576506269:web:44e72a85baa050b06a9974",
  measurementId: "G-8CFX50WZEL"
};

// --- GEMINI API KEY ---
// Siguraduhing tama ang copy-paste mo dito
const GEMINI_API_KEY = "AIzaSyAaMuMWT2k3zXBVUdTxZgAmcywCQeifkho";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- GLOBAL DATA ---
let portfolioData = {
    profile: {},
    skills: [],
    projects: []
};

// --- DOM HELPERS ---
const setText = (id, text) => { if(document.getElementById(id)) document.getElementById(id).innerText = text; };
const setSrc = (id, src) => { if(document.getElementById(id) && src) document.getElementById(id).src = src; };
const setHref = (id, url) => { const el = document.getElementById(id); if(el) { if(url) { el.href = url; el.style.display = 'flex'; } else { el.style.display = 'none'; } } };

// --- 1. FIREBASE LISTENERS ---

function listenToProfile() {
    onSnapshot(doc(db, "profile", "main"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            portfolioData.profile = data;

            setText('nav-name', (data.name || 'Dev') + "Portfolio");
            setText('card-name', data.name);
            setText('card-role', data.role);
            setText('card-email', data.email);
            setText('card-location', data.location);
            setText('card-website', data.website);
            setText('bio-heading', data.bio_heading);
            setText('bio-desc', data.bio_description);
            setText('about-name', data.name);
            
            if(data.stat_languages) setText('disp-lang', data.stat_languages);
            if(data.stat_projects) setText('disp-proj', data.stat_projects);
            if(data.stat_experience) setText('disp-exp', data.stat_experience);

            setSrc('profile-img', data.avatar_url);
            setText('contact-email', data.email);
            setText('contact-loc', data.location);
            setText('footer-name', data.name);
            setHref('footer-fb', data.facebook);
            setHref('footer-tg', data.telegram);
            setHref('footer-gh', data.github);
            if(document.getElementById('footer-mail')) document.getElementById('footer-mail').href = "mailto:" + data.email;
        }
    });
}

function listenToSkills() {
    const q = query(collection(db, "skills"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('skills-container');
        portfolioData.skills = [];
        if (container) {
            container.innerHTML = '';
            snapshot.forEach((doc) => {
                const skill = doc.data();
                portfolioData.skills.push(skill.tech_name);
                
                const div = document.createElement('div');
                div.className = 'tech-item';
                div.style.background = skill.color;
                div.innerHTML = `<i class="${skill.icon_class}"></i><span>${skill.tech_name}</span>`;
                container.appendChild(div);
            });
        }
    });
}

function listenToProjects() {
    const q = query(collection(db, "projects"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('projects-container');
        portfolioData.projects = [];
        if (container) {
            container.innerHTML = '';
            snapshot.forEach((doc) => {
                const project = doc.data();
                portfolioData.projects.push(`${project.title} (${project.category})`);

                const div = document.createElement('div');
                div.className = 'project-card';
                div.innerHTML = `
                    <img src="${project.image_url}" alt="${project.title}">
                    <div class="project-info">
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                        <a href="${project.project_link || '#'}" class="read-more" target="_blank">Read More <i class="cil-arrow-right"></i></a>
                        <div class="meta"><span>${project.category}</span><span>${project.date_text}</span></div>
                    </div>
                `;
                container.appendChild(div);
            });
        }
    });
}

// --- 2. AI CHATBOT LOGIC (DIRECT FETCH VERSION) ---

async function askGemini(userMessage) {
    // SYSTEM PROMPT: Dito natin tinuturuan ang AI kung sino siya
    const systemPrompt = `
        Role: You are an AI assistant for the portfolio of ${portfolioData.profile.name}.
        Tone: Professional, concise, tech-savvy (like a terminal output).
        
        CONTEXT DATA:
        - Name: ${portfolioData.profile.name}
        - Role: ${portfolioData.profile.role}
        - Bio: ${portfolioData.profile.bio_description}
        - Email: ${portfolioData.profile.email}
        - Skills: ${portfolioData.skills.join(', ')}
        - Projects: ${portfolioData.projects.join(', ')}
        
        RULES:
        1. Only answer questions related to ${portfolioData.profile.name}.
        2. If asked about general topics (math, history, etc.), say: "ACCESS DENIED: I can only process queries about the developer."
        3. Keep answers short (max 2-3 sentences).
        4. Do NOT use Markdown formatting (no bold/italic).
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
        contents: [
            {
                role: "user",
                parts: [{ text: systemPrompt + "\n\nUser Question: " + userMessage }]
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("AI Error:", data.error);
            return "Error: " + data.error.message;
        }

        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Network Error:", error);
        return "Error: Connection failed.";
    }
}

// --- 3. CHAT UI HANDLER ---
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

if (userInput) {
    userInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const message = userInput.value.trim();
            if (!message) return;

            // Add User Message
            addMessage(message, 'user');
            userInput.value = '';
            
            // Show Loading
            const loadingId = addMessage("Analyzing...", 'bot');

            // Get AI Response
            const reply = await askGemini(message);
            
            // Remove Loading & Show Reply
            const loadingMsg = document.getElementById(loadingId);
            if(loadingMsg) loadingMsg.remove();
            
            addMessage(reply, 'bot');
        }
    });
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    const id = `msg-${Date.now()}`;
    div.id = id;
    
    const prefix = sender === 'bot' ? '<span class="prompt">RyanAI:~$</span>' : '<span class="prompt">></span>';
    div.innerHTML = `${prefix} ${text}`;
    
    if(chatBox) {
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    return id;
}

// --- INITIALIZATION ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('show');
    });
});
document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));

listenToProfile();
listenToSkills();
listenToProjects();