const SUPABASE_URL = "https://hunapxoxqkkfvaqejwii.supabase.co";

const SUPABASE_KEY = "sb_publishable_AkD-sMSpXyBW3Eb4taVQxg_zbi3es4B";
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =========================================================
// FRIEND TOKEN
// =========================================================

const hashParams =
    new URLSearchParams(
        window.location.hash.substring(1)
    );

const friendToken =
    hashParams.get("friend");


// =========================================================
// ELEMENTS
// =========================================================

const welcomeSection =
    document.getElementById("welcomeSection");

const totalCard =
    document.getElementById("totalCard");

const totalTitle =
    document.getElementById("totalTitle");

const totalDebt =
    document.getElementById("totalDebt");

const totalSubtitle =
    document.getElementById("totalSubtitle");

const friendsSection =
    document.getElementById("friendsSection");

const friendsTitle =
    document.getElementById("friendsTitle");

const friendsList =
    document.getElementById("friendsList");

const historySection =
    document.getElementById("historySection");

const tripsList =
    document.getElementById("tripsList");

const openModal =
    document.getElementById("openModal");

const modal =
    document.getElementById("modal");


// =========================================================
// INITIAL PAGE STATE
// =========================================================

function setupPage() {

    /*
     * Немає персонального токена.
     *
     * Це звичайний відвідувач.
     */

    if (!friendToken) {

        // Показуємо welcome
        welcomeSection.classList.remove("hidden");


        // Ховаємо всі фінансові дані
        totalCard.classList.add("hidden");

        friendsSection.classList.add("hidden");

        historySection.classList.add("hidden");


        // Ховаємо кнопку додавання
        openModal.classList.add("hidden");


        return;
    }


    /*
     * Є friendToken.
     *
     * Це персональна сторінка друга.
     */

    welcomeSection.classList.add("hidden");

    totalCard.classList.remove("hidden");

    friendsSection.classList.remove("hidden");

    historySection.classList.remove("hidden");


    // Друг не може додавати поїздки
    openModal.classList.add("hidden");


    friendsTitle.innerHTML = `
        <h2>👤 Ваш баланс</h2>
    `;

}


// =========================================================
// LOAD TRIPS
// =========================================================

async function loadTrips() {

    /*
     * Якщо немає friendToken,
     * взагалі НЕ завантажуємо борги.
     */

    if (!friendToken) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient

        .from("trips")

        .select(`
            id,
            friend_id,
            trip_date,
            amount,
            comment,
            created_at,
            friends (
                id,
                name,
                slug,
                public_token
            )
        `)

        .order(
            "trip_date",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Помилка завантаження:",
            error
        );

        tripsList.innerHTML =
            "Помилка завантаження.";

        return;
    }


    // =====================================================
    // FILTER BY TOKEN
    // =====================================================

    const filteredTrips =
        data.filter(
            trip =>
                trip.friends &&
                trip.friends.public_token ===
                    friendToken
        );


    // =====================================================
    // TOTAL
    // =====================================================

    calculateTotal(
        filteredTrips
    );


    // =====================================================
    // FRIEND PROFILE
    // =====================================================

    renderSingleFriend(
        filteredTrips
    );


    // =====================================================
    // HISTORY
    // =====================================================

    renderTrips(
        filteredTrips
    );

}


// =========================================================
// CALCULATE TOTAL
// =========================================================

function calculateTotal(trips) {

    const total =
        trips.reduce(
            (sum, trip) =>
                sum +
                Number(trip.amount),
            0
        );


    totalDebt.textContent =
        `${total.toFixed(2)} €`;
}


// =========================================================
// SINGLE FRIEND
// =========================================================

function renderSingleFriend(
    trips
) {

    if (
        trips.length === 0
    ) {

        friendsList.innerHTML = `
            <div class="empty">
                Посилання недійсне
                або друга не знайдено.
            </div>
        `;

        totalDebt.textContent =
            "—";

        return;
    }


    const friend =
        trips[0].friends;


    const total =
        trips.reduce(
            (sum, trip) =>
                sum +
                Number(trip.amount),
            0
        );


    friendsList.innerHTML = `

        <div class="friend-profile">

            <div class="friend-profile-name">

                👤
                ${escapeHtml(
                    friend.name
                )}

            </div>


            <div class="friend-profile-label">
                Ваш борг
            </div>


            <div class="friend-profile-debt">

                ${total.toFixed(2)} €

            </div>

        </div>

    `;

}


// =========================================================
// HISTORY
// =========================================================

function renderTrips(trips) {

    if (
        trips.length === 0
    ) {

        tripsList.innerHTML = `
            <div class="empty">
                Поки немає поїздок.
            </div>
        `;

        return;
    }


    tripsList.innerHTML =

        trips

            .map(
                trip => {

                    const date =
                        new Date(
                            trip.trip_date +
                            "T00:00:00"
                        )
                        .toLocaleDateString(
                            "uk-UA"
                        );


                    return `

                        <div class="trip">

                            <div class="trip-info">

                                <div class="trip-friend">

                                    ${escapeHtml(
                                        trip.friends.name
                                    )}

                                </div>


                                <div class="trip-meta">

                                    ${date}

                                    ${
                                        trip.comment
                                            ? " · " +
                                              escapeHtml(
                                                  trip.comment
                                              )
                                            : ""
                                    }

                                </div>

                            </div>


                            <div class="trip-amount">

                                +${Number(
                                    trip.amount
                                ).toFixed(2)} €

                            </div>

                        </div>

                    `;

                }
            )

            .join("");
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


// =========================================================
// START
// =========================================================

setupPage();

loadTrips();
