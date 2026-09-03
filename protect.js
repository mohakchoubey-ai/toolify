// ============================================================
// TOOLIFY PROTECT.JS
// JANMASHTAMI SPECIAL — GLOBAL EXPERIENCE
//
// Features:
// • 3-day guest access
// • Normal Firebase protection after campaign expiry
// • Full-page Janmashtami animation
// • Floating diyas
// • Krishna flute notes
// • Peacock-feather particles
// • Golden/saffron particles
// • Radial festive glow
// • No click blocking during guest campaign
// ============================================================

import { auth } from "./firebase-auth.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// ============================================================
// CONFIG
// ============================================================

const CAMPAIGN_KEY = "toolify_janmashtami_guest_access";

const CAMPAIGN_DURATION =
    3 * 24 * 60 * 60 * 1000;

const LOGIN_URL =
    window.PROTECT_LOGIN_URL ||
    "/toolify/login.html";


// ============================================================
// PAGE ACCESS STATE
// ============================================================

let isPageAllowed = false;


// ============================================================
// 3-DAY CAMPAIGN
// ============================================================

function getCampaignStart() {

    let start =
        localStorage.getItem(CAMPAIGN_KEY);

    if (!start) {

        start = String(Date.now());

        localStorage.setItem(
            CAMPAIGN_KEY,
            start
        );
    }

    return Number(start);
}


function isGuestCampaignActive() {

    const start =
        getCampaignStart();

    return (
        Date.now() - start
        <
        CAMPAIGN_DURATION
    );
}


// ============================================================
// GLOBAL JANMASHTAMI EXPERIENCE
// ============================================================

function injectJanmashtamiExperience() {

    if (document.getElementById(
        "toolify-janmashtami"
    )) {
        return;
    }


    // --------------------------------------------------------
    // CSS
    // --------------------------------------------------------

    const style =
        document.createElement("style");

    style.id =
        "toolify-janmashtami-style";

    style.textContent = `

    #toolify-janmashtami {

        position: fixed;

        inset: 0;

        width: 100vw;
        height: 100vh;

        z-index: 999999;

        pointer-events: none;

        overflow: hidden;

        font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

    }


    /* -------------------------------------------------------
       FESTIVE BACKGROUND GLOW
    ------------------------------------------------------- */

    #toolify-janmashtami::before {

        content: "";

        position: absolute;

        inset: 0;

        background:
            radial-gradient(
                circle at 50% 100%,
                rgba(255,166,0,.14),
                transparent 42%
            ),

            radial-gradient(
                circle at 15% 20%,
                rgba(255,193,7,.08),
                transparent 30%
            ),

            radial-gradient(
                circle at 85% 20%,
                rgba(0,180,255,.07),
                transparent 30%
            );

        animation:
            jkGlow 5s ease-in-out infinite alternate;

    }


    /* -------------------------------------------------------
       TOP FESTIVE BORDER
    ------------------------------------------------------- */

    .jk-border {

        position: absolute;

        top: 0;
        left: 0;
        right: 0;

        height: 3px;

        background:
            linear-gradient(
                90deg,
                transparent,
                #ffb300,
                #fff3b0,
                #ff8f00,
                transparent
            );

        box-shadow:
            0 0 20px rgba(255,179,0,.7);

        animation:
            jkBorder 2.5s linear infinite;

    }


    /* -------------------------------------------------------
       PARTICLES
    ------------------------------------------------------- */

    .jk-particle {

        position: absolute;

        width: 5px;
        height: 5px;

        border-radius: 50%;

        background: #ffd54f;

        box-shadow:
            0 0 8px rgba(255,193,7,.8);

        opacity: .7;

        animation:
            jkFloat linear infinite;

    }


    .jk-particle.blue {

        background: #4dd0e1;

        box-shadow:
            0 0 9px rgba(77,208,225,.8);

    }


    .jk-particle.white {

        background: #fff8dc;

        box-shadow:
            0 0 9px rgba(255,255,255,.8);

    }


    /* -------------------------------------------------------
       FLOWER PETALS
    ------------------------------------------------------- */

    .jk-petal {

        position: absolute;

        width: 9px;
        height: 15px;

        border-radius:
            80% 20% 80% 20%;

        background:
            linear-gradient(
                135deg,
                #ffd54f,
                #ff9800
            );

        opacity: .65;

        animation:
            jkPetal linear infinite;

    }


    /* -------------------------------------------------------
       FLUTE NOTES
    ------------------------------------------------------- */

    .jk-note {

        position: absolute;

        font-size: 20px;

        color: rgba(255,213,79,.7);

        text-shadow:
            0 0 10px rgba(255,193,7,.7);

        animation:
            jkNote 7s linear infinite;

    }


    /* -------------------------------------------------------
       DIYA
    ------------------------------------------------------- */

    .jk-diya {

        position: absolute;

        bottom: 22px;

        width: 44px;
        height: 22px;

        border-radius:
            0 0 24px 24px;

        background:
            linear-gradient(
                #ffb300,
                #e65100
            );

        box-shadow:
            0 4px 12px rgba(255,152,0,.35);

        opacity: .8;

    }


    .jk-diya::before {

        content: "";

        position: absolute;

        width: 13px;
        height: 20px;

        left: 50%;
        top: -15px;

        transform:
            translateX(-50%);

        border-radius:
            50% 50% 50% 50%;

        background:
            radial-gradient(
                circle,
                #fffde7 0%,
                #ffd54f 35%,
                #ff9800 65%,
                transparent 70%
            );

        filter:
            drop-shadow(
                0 0 8px #ffb300
            );

        animation:
            jkFlame .7s ease-in-out infinite alternate;

    }


    /* -------------------------------------------------------
       SIDE KRISHNA SYMBOLS
    ------------------------------------------------------- */

    .jk-side-symbol {

        position: absolute;

        font-size: 28px;

        opacity: .12;

        color: #ffb300;

        animation:
            jkSymbol 6s ease-in-out infinite;

    }


    /* -------------------------------------------------------
       CENTER MESSAGE
    ------------------------------------------------------- */

    .jk-center {

        position: absolute;

        left: 50%;
        top: 50%;

        transform:
            translate(-50%, -50%);

        text-align: center;

        opacity: .045;

        white-space: nowrap;

        user-select: none;

    }


    .jk-center-title {

        font-size:
            clamp(45px, 9vw, 130px);

        font-weight: 800;

        letter-spacing:
            .08em;

    }


    .jk-center-sub {

        font-size:
            clamp(12px, 2vw, 18px);

        letter-spacing:
            .35em;

        margin-top: 8px;

    }


    /* -------------------------------------------------------
       ANIMATIONS
    ------------------------------------------------------- */

    @keyframes jkGlow {

        from {
            opacity: .55;
            transform: scale(1);
        }

        to {
            opacity: 1;
            transform: scale(1.04);
        }

    }


    @keyframes jkBorder {

        from {
            transform: translateX(-20%);
        }

        to {
            transform: translateX(20%);
        }

    }


    @keyframes jkFloat {

        0% {
            transform:
                translateY(110vh)
                translateX(0)
                scale(.5);

            opacity: 0;
        }

        15% {
            opacity: .75;
        }

        85% {
            opacity: .55;
        }

        100% {
            transform:
                translateY(-15vh)
                translateX(80px)
                scale(1.2);

            opacity: 0;
        }

    }


    @keyframes jkPetal {

        0% {
            transform:
                translateY(-10vh)
                translateX(0)
                rotate(0deg);

            opacity: 0;
        }

        15% {
            opacity: .7;
        }

        100% {
            transform:
                translateY(110vh)
                translateX(180px)
                rotate(360deg);

            opacity: 0;
        }

    }


    @keyframes jkNote {

        0% {
            transform:
                translate(-20px, 20px)
                scale(.7);

            opacity: 0;
        }

        20% {
            opacity: .7;
        }

        80% {
            opacity: .4;
        }

        100% {
            transform:
                translate(160px, -100px)
                scale(1.2);

            opacity: 0;
        }

    }


    @keyframes jkFlame {

        from {
            transform:
                translateX(-50%)
                scale(.8);

        }

        to {
            transform:
                translateX(-50%)
                scale(1.15);

        }

    }


    @keyframes jkSymbol {

        0%,100% {
            transform:
                translateY(0)
                rotate(-4deg);
        }

        50% {
            transform:
                translateY(-15px)
                rotate(4deg);
        }

    }


    /* -------------------------------------------------------
       MOBILE PERFORMANCE
    ------------------------------------------------------- */

    @media (max-width: 600px) {

        .jk-particle {
            width: 3px;
            height: 3px;
        }

        .jk-petal {
            width: 7px;
            height: 12px;
        }

        .jk-diya {
            transform: scale(.7);
        }

        .jk-center {
            opacity: .035;
        }

    }

    `;

    document.head.appendChild(style);


    // --------------------------------------------------------
    // HTML OVERLAY
    // --------------------------------------------------------

    const overlay =
        document.createElement("div");

    overlay.id =
        "toolify-janmashtami";

    overlay.innerHTML = `

        <div class="jk-border"></div>

        <div class="jk-center">
            <div class="jk-center-title">
                श्री कृष्ण
            </div>

            <div class="jk-center-sub">
                JANMASHTAMI • TOOLIFY
            </div>
        </div>

        <div class="jk-side-symbol"
             style="left:4%;top:18%;">
            🦚
        </div>

        <div class="jk-side-symbol"
             style="right:4%;top:30%;">
            🪷
        </div>

        <div class="jk-side-symbol"
             style="left:7%;bottom:25%;">
            🪈
        </div>

        <div class="jk-side-symbol"
             style="right:8%;bottom:18%;">
            🦚
        </div>

        <div class="jk-diya"
             style="left:8%;">
        </div>

        <div class="jk-diya"
             style="right:8%;">
        </div>

    `;

    document.body.appendChild(overlay);


    // --------------------------------------------------------
    // PARTICLES
    // --------------------------------------------------------

    const particleCount =
        window.innerWidth < 600
            ? 18
            : 32;


    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        const particle =
            document.createElement("div");

        particle.className =
            "jk-particle";

        if (i % 5 === 0) {
            particle.classList.add("blue");
        }

        if (i % 7 === 0) {
            particle.classList.add("white");
        }

        particle.style.left =
            Math.random() * 100 + "%";

        particle.style.animationDuration =
            (5 + Math.random() * 8) + "s";

        particle.style.animationDelay =
            (-Math.random() * 10) + "s";

        particle.style.opacity =
            (.25 + Math.random() * .6).toFixed(2);

        overlay.appendChild(particle);

    }


    // --------------------------------------------------------
    // PETALS
    // --------------------------------------------------------

    const petalCount =
        window.innerWidth < 600
            ? 8
            : 16;


    for (
        let i = 0;
        i < petalCount;
        i++
    ) {

        const petal =
            document.createElement("div");

        petal.className =
            "jk-petal";

        petal.style.left =
            Math.random() * 100 + "%";

        petal.style.animationDuration =
            (8 + Math.random() * 8) + "s";

        petal.style.animationDelay =
            (-Math.random() * 12) + "s";

        overlay.appendChild(petal);

    }


    // --------------------------------------------------------
    // FLUTE NOTES
    // --------------------------------------------------------

    const notes =
        ["♪", "♫", "♬"];

    for (let i = 0; i < 7; i++) {

        const note =
            document.createElement("div");

        note.className =
            "jk-note";

        note.textContent =
            notes[i % notes.length];

        note.style.left =
            (10 + Math.random() * 75) + "%";

        note.style.top =
            (15 + Math.random() * 70) + "%";

        note.style.animationDelay =
            (-Math.random() * 7) + "s";

        note.style.animationDuration =
            (5 + Math.random() * 4) + "s";

        overlay.appendChild(note);

    }

}


// ============================================================
// ACCESS CONTROL
// ============================================================

function hidePage() {

    document.documentElement.style.visibility =
        "hidden";

}


function showPage() {

    isPageAllowed = true;

    document.documentElement.style.visibility =
        "visible";

    if (document.body) {

        document.body.style.visibility =
            "visible";

    }

}


function redirectToLogin() {

    const returnTo =
        encodeURIComponent(
            window.location.pathname +
            window.location.search +
            window.location.hash
        );

    window.location.replace(
        `${LOGIN_URL}?redirect=${returnTo}`
    );

}


// ============================================================
// AUTH CHECK
// ============================================================

function checkAccess() {

    // --------------------------------------------------------
    // GUEST CAMPAIGN
    // --------------------------------------------------------

    if (isGuestCampaignActive()) {

        console.log(
            "Toolify: Janmashtami guest access active."
        );

        showPage();

        return;

    }


    // --------------------------------------------------------
    // NORMAL FIREBASE PROTECTION
    // --------------------------------------------------------

    onAuthStateChanged(
        auth,
        user => {

            const isLoggedIn =
                !!user &&
                !user.isAnonymous;


            if (!isLoggedIn) {

                hidePage();

                redirectToLogin();

                return;

            }


            showPage();

        }
    );

}


// ============================================================
// INITIALIZE
// ============================================================

function initialize() {

    // Animation should appear regardless
    // of whether the user is logged in.

    injectJanmashtamiExperience();

    checkAccess();

}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        { once: true }
    );

} else {

    initialize();

}


// ============================================================
// BACK/FORWARD CACHE
// ============================================================

window.addEventListener(
    "pageshow",
    event => {

        if (event.persisted) {
            checkAccess();
        }

    }
);


// ============================================================
// EXPORT
// ============================================================

export {
    isPageAllowed
};
