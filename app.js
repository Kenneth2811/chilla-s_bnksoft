// AUTHENTICATION LOGIC & APPLICATION STATE
document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("customLoginForm");
    const authViewport = document.getElementById("authViewport");
    const appViewport = document.getElementById("appViewport");
    const authError = document.getElementById("authError");
    const signOutBtn = document.getElementById("btnSignOut");

    // Strictly enforce updated login credentials
    const VALID_USER = "Thomas301";
    const VALID_PASS = "T@Muller1";

    // Check if session is already active
    if (localStorage.getItem("uc_session_active") === "true") {
        if (authViewport) authViewport.style.display = "none";
        if (appViewport) appViewport.style.display = "flex";
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            
            const usernameInput = document.getElementById("vaultUser").value.trim();
            const passwordInput = document.getElementById("vaultPass").value;

            if (usernameInput === VALID_USER && passwordInput === VALID_PASS) {
                authError.style.display = "none";
                authViewport.style.display = "none";
                appViewport.style.display = "flex";
                localStorage.setItem("uc_session_active", "true");
                
                appendLog(`[AUTH] Clearance granted for user: ${VALID_USER}`);
            } else {
                authError.style.display = "flex";
                appendLog(`[SECURITY] Authentication failed for user string: ${usernameInput}`);
            }
        });
    }

    // Sign Out handling
    if (signOutBtn) {
        signOutBtn.addEventListener("click", function () {
            localStorage.removeItem("uc_session_active");
            appViewport.style.display = "none";
            authViewport.style.display = "flex";
            document.getElementById("vaultUser").value = "";
            document.getElementById("vaultPass").value = "";
        });
    }

    // Navigation handling between tabs
    const navItems = {
        navOverview: "panelOverview",
        navClearing: "panelClearing",
        navStatements: "panelStatements",
        navFX: "panelFX",
        navCards: "panelCards",
        navLogs: "panelLogs",
        navSettings: "panelSettings"
    };

    Object.keys(navItems).forEach(navId => {
        const item = document.getElementById(navId);
        if (item) {
            item.addEventListener("click", function () {
                document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
                this.classList.add("active");

                document.querySelectorAll(".dash-panel").forEach(panel => panel.style.display = "none");
                const targetPanel = document.getElementById(navItems[navId]);
                if (targetPanel) {
                    targetPanel.style.display = "block";
                }
            });
        }
    });

    // Wire Transfer Submission logic
    const wireForm = document.getElementById("wireTransferForm");
    if (wireForm) {
        wireForm.addEventListener("submit", function (e) {
            e.preventDefault();
            openSuccessModal();
        });
    }
});

// Helper for dynamic console logging
function appendLog(message) {
    const logHook = document.getElementById("dynamicLogHook");
    if (logHook) {
        const entry = document.createElement("div");
        entry.className = "log-entry";
        entry.textContent = message;
        logHook.parentNode.insertBefore(entry, logHook);
    }
}

// Notification Dismissal
function dismissNotification() {
    const banner = document.getElementById("portalNotification");
    if (banner) {
        banner.style.display = "none";
    }
}

// Modal Timer Logic
let timerInterval = null;
let secondsElapsed = 0;

function openSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) {
        modal.style.display = "flex";
        secondsElapsed = 0;
        updateTimerDisplay();
        
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    }
}

function closeSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) {
        modal.style.display = "none";
        clearInterval(timerInterval);
    }
}

function updateTimerDisplay() {
    const display = document.getElementById("liveTimerDisplay");
    if (display) {
        const hrs = String(Math.floor(secondsElapsed / 3600)).padStart(2, '0');
        const mins = String(Math.floor((secondsElapsed % 3600) / 60)).padStart(2, '0');
        const secs = String(secondsElapsed % 60).padStart(2, '0');
        display.textContent = `${hrs}:${mins}:${secs}`;
    }
}