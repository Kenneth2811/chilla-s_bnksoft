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

    // Check session and evaluate simulated server-side transaction timer on load
    if (localStorage.getItem("uc_session_active") === "true") {
        if (authViewport) authViewport.style.display = "none";
        if (appViewport) appViewport.style.display = "flex";
        evaluateServerSideTransaction();
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
                
                // Evaluate server-side transaction limits immediately upon successful login
                evaluateServerSideTransaction();
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

    // Wire Transfer Submission logic with Simulated Server-Side Time
    const wireForm = document.getElementById("wireTransferForm");
    if (wireForm) {
        wireForm.addEventListener("submit", function (e) {
            e.preventDefault();
            
            // Record transaction start time using simulated server time (Date.now())
            const serverCreationTime = Date.now();
            const oneHourInMs = 60 * 60 * 1000;
            const serverExpirationTime = serverCreationTime + oneHourInMs;

            // Store transaction data securely in localStorage (simulating database storage)
            localStorage.setItem("uc_tx_status", "Processing");
            localStorage.setItem("uc_tx_created", serverCreationTime);
            localStorage.setItem("uc_tx_expires", serverExpirationTime);

            appendLog(`[DATABASE] Transaction recorded. Status: Processing. Creation Timestamp (Server): ${serverCreationTime}`);
            
            openSuccessModal();
        });
    }
    
    // Periodically check transaction timer while session is active
    setInterval(evaluateServerSideTransaction, 1000);
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

function openSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) {
        modal.style.display = "flex";
        updateTimerDisplay();
        
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
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

// Calculate elapsed or remaining time strictly using server timestamps
function updateTimerDisplay() {
    const display = document.getElementById("liveTimerDisplay");
    const createdStr = localStorage.getItem("uc_tx_created");
    
    if (display && createdStr) {
        const serverNow = Date.now();
        const createdTime = parseInt(createdStr, 10);
        const elapsedSeconds = Math.floor((serverNow - createdTime) / 1000);
        
        if (elapsedSeconds >= 0) {
            const hrs = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
            const mins = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
            const secs = String(elapsedSeconds % 60).padStart(2, '0');
            display.textContent = `${hrs}:${mins}:${secs}`;
        }
    }
}

// Core evaluation function simulating backend server verification logic
function evaluateServerSideTransaction() {
    const txStatus = localStorage.getItem("uc_tx_status");
    const expiresStr = localStorage.getItem("uc_tx_expires");

    if (txStatus === "Processing" && expiresStr) {
        const serverNow = Date.now();
        const expirationTime = parseInt(expiresStr, 10);

        // Check if the 1-hour server-side window has expired
        if (serverNow >= expirationTime) {
            // 1. Update transaction status to Failed
            localStorage.setItem("uc_tx_status", "Failed");
            
            // 2. Change account status to ACCOUNT ON HOLD
            localStorage.setItem("uc_account_status", "ACCOUNT ON HOLD");

            // Apply UI updates for failure workflow
            applyAccountOnHoldUI();
            appendLog(`[SECURITY] Transaction window expired. Status updated to Failed. Account placed ON HOLD.`);
        }
    } else if (txStatus === "Failed") {
        applyAccountOnHoldUI();
    }
}

// Apply administrative hold UI adjustments and notification banners
function applyAccountOnHoldUI() {
    // Show Portal Notification Banner
    const banner = document.getElementById("portalNotification");
    const notificationText = document.getElementById("notificationText");
    if (banner && notificationText) {
        notificationText.innerHTML = "Your transfer could not be completed within the required processing window. Please contact customer support for further assistance.";
        banner.style.display = "flex";
    }

    // Update System Status Badge in Account Summary
    const systemStatusBadge = document.getElementById("systemStatusBadge");
    if (systemStatusBadge) {
        systemStatusBadge.textContent = "ACCOUNT ON HOLD";
        systemStatusBadge.className = "meta-value status-hold-text"; // Ensure CSS handles styling if available
        systemStatusBadge.style.color = "#F87171";
    }

    // Update Header Node Status
    const headerStatus = document.getElementById("headerStatus");
    if (headerStatus) {
        headerStatus.textContent = "ON HOLD";
        headerStatus.style.color = "#F87171";
    }

    // Update Balance Hero Card Alert Box
    const holdAlertBox = document.getElementById("holdAlertBox");
    const holdAlertTitle = document.getElementById("holdAlertTitle");
    const holdAlertBody = document.getElementById("holdAlertBody");
    if (holdAlertBox && holdAlertTitle && holdAlertBody) {
        holdAlertBox.className = "hold-mini-alert status-error";
        holdAlertTitle.innerHTML = "🔴 Administrative Hold";
        holdAlertBody.innerHTML = "Your account has been placed under an administrative review due to an unsuccessful transaction. Outbound transfers and certain account services have been temporarily restricted while the transaction is being reviewed by the Bank Operations Department. Please contact Customer Support or visit your nearest branch for assistance.";
    }

    // Restrict Transfer Form Submission / Display Rejection Box
    const wireForm = document.getElementById("wireTransferForm");
    const transferRejectionBox = document.getElementById("transferRejectionBox");
    if (wireForm) {
        const submitBtn = wireForm.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.5";
            submitBtn.style.cursor = "not-allowed";
        }
    }
    if (transferRejectionBox) {
        transferRejectionBox.style.display = "block";
    }
}
