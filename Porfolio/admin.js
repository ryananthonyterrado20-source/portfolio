// --- IMPORTS (Wala nang Auth at Storage imports) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION ---
// 1. FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAHZaFAqxb4COeY8ZpQ02AKYPMMX2n9ZZo",
  authDomain: "myportfolio-2c0da.firebaseapp.com",
  projectId: "myportfolio-2c0da",
  storageBucket: "myportfolio-2c0da.firebasestorage.app",
  messagingSenderId: "911576506269",
  appId: "1:911576506269:web:44e72a85baa050b06a9974",
  measurementId: "G-8CFX50WZEL"
};

// 2. CLOUDINARY CONFIG (Ito ang magpapagana ng Upload)
const CLOUDINARY_CLOUD_NAME = "dn7bcc3yc"; 
const CLOUDINARY_UPLOAD_PRESET = "xo5cl6pv"; 

// Initialize Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Admin Loaded (Cloudinary Mode - No Login)");

    // Load data agad-agad (Wala nang login check)
    loadAdminData();

    // --- HELPER: UPLOAD TO CLOUDINARY ---
    // Ito ang kapalit ng Firebase Storage para libre ang upload
    async function uploadImage(file) {
        if(!file) return null;
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Cloudinary Error");

            const data = await response.json();
            console.log("Upload Success:", data.secure_url);
            return data.secure_url; // Ito ang link na ibabalik
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed! Check Console.");
            return null;
        }
    }

    // --- HELPER: PREVIEW ---
    function setupPreview(inputId, imgId) {
        const input = document.getElementById(inputId);
        const img = document.getElementById(imgId);
        if(input && img) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file) img.src = URL.createObjectURL(file);
            });
        }
    }
    setupPreview('p-avatar-file', 'avatar-preview');

    // Button: Go to Website
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.innerText = "View Website";
        logoutBtn.onclick = () => window.location.href = 'index.html';
    }

    // --- ADMIN FUNCTIONS ---
    async function loadAdminData() {
        loadProfile();
        loadSkills();
        loadProjects();
    }

    // --- PROFILE ---
    async function loadProfile() {
        const docRef = doc(db, "profile", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val || ''; };
            
            setVal('p-name', data.name);
            setVal('p-role', data.role);
            setVal('p-email', data.email);
            setVal('p-location', data.location);
            setVal('p-website', data.website);
            setVal('p-bio-heading', data.bio_heading);
            setVal('p-bio-desc', data.bio_description);
            setVal('p-stat-lang', data.stat_languages);
            setVal('p-stat-proj', data.stat_projects);
            setVal('p-stat-exp', data.stat_experience);
            setVal('p-fb', data.facebook);
            setVal('p-tg', data.telegram);
            setVal('p-gh', data.github);

            if(document.getElementById('p-avatar-url')) document.getElementById('p-avatar-url').value = data.avatar_url || '';
            if(document.getElementById('avatar-preview')) document.getElementById('avatar-preview').src = data.avatar_url || '';
        }
    }

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = profileForm.querySelector('button[type="submit"]');
            saveBtn.innerText = "Uploading & Saving...";
            saveBtn.disabled = true;

            const fileInput = document.getElementById('p-avatar-file');
            let avatarUrl = document.getElementById('p-avatar-url').value;

            // Upload to Cloudinary if file selected
            if(fileInput.files.length > 0) {
                const uploadedUrl = await uploadImage(fileInput.files[0]);
                if(uploadedUrl) avatarUrl = uploadedUrl;
            }

            const profileData = {
                name: document.getElementById('p-name').value,
                role: document.getElementById('p-role').value,
                email: document.getElementById('p-email').value,
                location: document.getElementById('p-location').value,
                website: document.getElementById('p-website').value,
                bio_heading: document.getElementById('p-bio-heading').value,
                bio_description: document.getElementById('p-bio-desc').value,
                stat_languages: document.getElementById('p-stat-lang').value,
                stat_projects: document.getElementById('p-stat-proj').value,
                stat_experience: document.getElementById('p-stat-exp').value,
                facebook: document.getElementById('p-fb').value,
                telegram: document.getElementById('p-tg').value,
                github: document.getElementById('p-gh').value,
                avatar_url: avatarUrl
            };

            try {
                await setDoc(doc(db, "profile", "main"), profileData, { merge: true });
                alert("Profile Saved!");
                document.getElementById('p-avatar-url').value = avatarUrl;
            } catch (error) {
                alert("Error saving: " + error.message);
            } finally {
                saveBtn.innerText = "Save Profile Changes";
                saveBtn.disabled = false;
            }
        });
    }

    // --- SKILLS ---
    async function loadSkills() {
        const querySnapshot = await getDocs(collection(db, "skills"));
        const list = document.getElementById('admin-skills-list');
        list.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const skill = doc.data();
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `<span><i class="${skill.icon_class}"></i> ${skill.tech_name}</span><button class="btn-delete" data-id="${doc.id}">Delete</button>`;
            list.appendChild(item);
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('Delete?')) { await deleteDoc(doc(db, "skills", e.target.dataset.id)); loadSkills(); }
            });
        });
    }

    const skillForm = document.getElementById('skill-form');
    if (skillForm) {
        skillForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addDoc(collection(db, "skills"), {
                tech_name: document.getElementById('s-name').value,
                icon_class: document.getElementById('s-icon').value,
                color: document.getElementById('s-color').value,
                timestamp: Date.now()
            });
            skillForm.reset();
            loadSkills();
        });
    }

    // --- PROJECTS ---
    async function loadProjects() {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const list = document.getElementById('admin-projects-list');
        list.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const proj = doc.data();
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `<span>${proj.title}</span><button class="btn-del-proj" data-id="${doc.id}">Delete</button>`;
            list.appendChild(item);
        });
        document.querySelectorAll('.btn-del-proj').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('Delete?')) { await deleteDoc(doc(db, "projects", e.target.dataset.id)); loadProjects(); }
            });
        });
    }

    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const addBtn = projectForm.querySelector('button[type="submit"]');
            addBtn.innerText = "Uploading...";
            addBtn.disabled = true;

            const fileInput = document.getElementById('pr-img-file');
            let imgUrl = document.getElementById('pr-img-url').value;

            // Upload to Cloudinary
            if(fileInput.files.length > 0) {
                const uploaded = await uploadImage(fileInput.files[0]);
                if(uploaded) imgUrl = uploaded;
            }

            if(!imgUrl) {
                alert("Image required");
                addBtn.innerText = "Add Project";
                addBtn.disabled = false;
                return;
            }

            await addDoc(collection(db, "projects"), {
                title: document.getElementById('pr-title').value,
                description: document.getElementById('pr-desc').value,
                image_url: imgUrl,
                project_link: document.getElementById('pr-link').value,
                category: document.getElementById('pr-cat').value,
                date_text: document.getElementById('pr-date').value,
                timestamp: Date.now()
            });

            projectForm.reset();
            loadProjects();
            addBtn.innerText = "Add Project";
            addBtn.disabled = false;
        });
    }
});