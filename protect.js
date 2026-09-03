// ============================================================
// TOOLIFY — 3 DAY GUEST ACCESS
// Janmashtami Special
// ============================================================

const CAMPAIGN_KEY = "toolify_janmashtami_guest_access";
const CAMPAIGN_DURATION = 3 * 24 * 60 * 60 * 1000;

// ------------------------------------------------------------
// Campaign start time
// ------------------------------------------------------------

function getCampaignStart() {
    let start = localStorage.getItem(CAMPAIGN_KEY);

    if (!start) {
        start = Date.now().toString();
        localStorage.setItem(CAMPAIGN_KEY, start);
    }

    return Number(start);
}

// ------------------------------------------------------------
// Check whether 3-day guest access is active
// ------------------------------------------------------------

function isGuestCampaignActive() {
    const start = getCampaignStart();
    const now = Date.now();

    return (now - start) < CAMPAIGN_DURATION;
}

// ------------------------------------------------------------
// Page access state
// ------------------------------------------------------------

let isPageAllowed = false;

// ------------------------------------------------------------
// LOGIN URL
// ------------------------------------------------------------

const LOGIN_URL =
    window.PROTECT_LOGIN_URL ||
    "/toolify/login.html";

// ------------------------------------------------------------
// Redirect to login
// ------------------------------------------------------------

function redirectToLogin() {
    const returnTo = encodeURIComponent(
        window.location.pathname +
        window.location.search +
        window.location.hash
    );

    window.location.replace(
        `${LOGIN_URL}?redirect=${returnTo}`
    );
}

// ------------------------------------------------------------
// Show page
// ------------------------------------------------------------

function showPage() {
    isPageAllowed = true;

    document.documentElement.style.display = "";
    document.documentElement.style.visibility = "visible";

    if (document.body) {
        document.body.style.visibility = "visible";
    }
}

// ------------------------------------------------------------
// Hide page
// ------------------------------------------------------------

function hidePage() {
    document.documentElement.style.display = "none";
}

// ------------------------------------------------------------
// Firebase authentication
// ------------------------------------------------------------

async function checkAccess() {

    // --------------------------------------------------------
    // 3-DAY GUEST CAMPAIGN
    // --------------------------------------------------------

    if (isGuestCampaignActive()) {

        console.log(
            "🎉 Toolify Janmashtami Guest Access ACTIVE"
        );

        console.log(
            "👤 Guests can access this page for 3 days."
        );

        showPage();

        return;
    }

    // --------------------------------------------------------
    // AFTER 3 DAYS
    // Normal authentication protection
    // --------------------------------------------------------

    console.log(
        "🔒 Guest campaign expired. Normal protection restored."
    );

    try {

        const { auth } = await import("/toolify/firebase-auth.js");

        const {
            onAuthStateChanged
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
        );

        onAuthStateChanged(auth, user => {

            const isLoggedIn =
                user &&
                (!user.isAnonymous);

            if (!isLoggedIn) {

                hidePage();

                redirectToLogin();

                return;
            }

            showPage();

        });

    } catch (error) {

        console.error(
            "Protection error:",
            error
        );

        hidePage();

        redirectToLogin();
    }
}

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------

hidePage();

checkAccess();

// ------------------------------------------------------------
// Back/forward cache protection
// ------------------------------------------------------------

window.addEventListener("pageshow", event => {

    if (event.persisted) {
        checkAccess();
    }

});

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

export {
    isPageAllowed
};
