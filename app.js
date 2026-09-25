const SUPABASE_URL = "https://hunapxoxqkkfvaqejwii.supabase.co";

const SUPABASE_KEY = "sb_publishable_AkD-sMSpXyBW3Eb4taVQxg_zbi3es4B";
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
const hashParams =
    new URLSearchParams(
        window.location.hash.substring(1)
    );

const friendToken =
    hashParams.get("friend");
const friendsTitle =
    document.getElementById(
        "friendsTitle"
    );

console.log(
    "KEY:",
    SUPABASE_KEY.substring(0, 20) + "..."
);

console.log(
    "Supabase client:",
    supabaseClient
);



const totalDebt =
    document.getElementById("totalDebt");

const friendsList =
    document.getElementById("friendsList");

const tripsList =
    document.getElementById("tripsList");

const modal =
    document.getElementById("modal");

const openModal =
    document.getElementById("openModal");

const closeModal =
    document.getElementById("closeModal");

const tripForm =
    document.getElementById("tripForm");

const tripDate =
    document.getElementById("tripDate");
const friendSelect =
    document.getElementById("friend");


tripDate.value =
    new Date().toISOString().split("T")[0];


openModal.addEventListener(
    "click",
    () => {
        modal.classList.remove("hidden");
    }
);


closeModal.addEventListener(
    "click",
    () => {
        modal.classList.add("hidden");
    }
);


async function loadTrips() {

    let query =
        supabaseClient
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


    const {
        data,
        error
    } = await query;


    if (error) {

        console.error(
            "Помилка завантаження:",
            error
        );

        tripsList.innerHTML =
            "Помилка завантаження.";

        return;
    }


    let filteredTrips = data;


    /*
     * Якщо в URL є ?friend=...
     * показуємо тільки цього друга
     */

    if (friendToken) {

        filteredTrips =
            data.filter(
                trip =>
                    trip.friends &&
                    trip.friends.public_token ===
                    friendToken
            );

    }


    calculateTotal(
        filteredTrips
    );


    if (friendToken) {

        renderSingleFriend(
            filteredTrips
        );

    } else {

        renderFriends(
            filteredTrips
        );

    }


    renderTrips(
        filteredTrips
    );

}

function calculateTotal(trips) {

    const total =
        trips.reduce(
            (sum, trip) =>
                sum + Number(trip.amount),
            0
        );


    totalDebt.textContent =
        `${total.toFixed(2)} €`;
}


function renderFriends(trips) {

    const debts = {};


    for (const trip of trips) {

        const friend = trip.friends;

        if (!friend) {
            continue;
        }


        const id = friend.id;


        if (!debts[id]) {

            debts[id] = {

                name: friend.name,

                slug: friend.slug,

                public_token:
                    friend.public_token,

                amount: 0

            };

        }


        debts[id].amount +=
            Number(trip.amount);

    }


    const friends =
        Object.values(debts);


    if (friends.length === 0) {

        friendsList.innerHTML =
            "<p>Поки немає записів.</p>";

        return;
    }


    friendsList.innerHTML =
        friends
            .map(friend => {

                const link =
                    `${window.location.origin}/#friend=${encodeURIComponent(
                        friend.public_token
                    )}`;


                return `
                    <div class="friend-row">

                        <span class="friend-name">

                            <a href="${link}">
                                ${escapeHtml(
                                    friend.name
                                )}
                            </a>

                        </span>


                        <span class="friend-debt">

                            ${friend.amount.toFixed(2)} €

                        </span>

                    </div>
                `;

            })
            .join("");
}

function renderSingleFriend(
    trips
) {

    if (
        trips.length === 0
    ) {

        friendsList.innerHTML = `
            <p>
                Посилання недійсне
                або друга не знайдено.
            </p>
        `;

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
                👤 ${escapeHtml(
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
function renderTrips(trips) {

    if (trips.length === 0) {

        tripsList.innerHTML =
            "<p>Поки немає поїздок.</p>";

        return;
    }


    tripsList.innerHTML =
        trips
            .map(trip => {

                const date =
                    new Date(
                        trip.trip_date +
                        "T00:00:00"
                    )
                    .toLocaleDateString(
                        "uk-UA"
                    );


                const friendName =
                    trip.friends
                        ? trip.friends.name
                        : "Невідомий";


                return `
                    <div class="trip">

                        <div class="trip-info">

                            <div class="trip-friend">

                                ${escapeHtml(
                                    friendName
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

            })
            .join("");
}

function escapeHtml(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}


tripForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const friendId =
            Number(
                document.getElementById(
                    "friend"
                ).value
            );


        const date =
            document.getElementById(
                "tripDate"
            ).value;


        const amount =
            Number(
                document.getElementById(
                    "amount"
                ).value
            );


        const comment =
            document.getElementById(
                "comment"
            ).value.trim();


        if (
            !friendId ||
            !date ||
            amount <= 0
        ) {

            alert(
                "Заповни друга, дату та суму."
            );

            return;
        }


        const {
            error
        } = await supabaseClient

            .from("trips")

            .insert({

                friend_id: friendId,

                trip_date: date,

                amount: amount,

                comment: comment

            });


        if (error) {

            console.error(
                "Помилка додавання:",
                error
            );

            alert(
                "Не вдалося додати запис."
            );

            return;
        }


        tripForm.reset();


        tripDate.value =
            new Date()
                .toISOString()
                .split("T")[0];


        modal.classList.add(
            "hidden"
        );


        await loadTrips();

    }
);
async function loadFriends() {

    console.log("🔄 Завантажую друзів...");


    const {
        data,
        error
    } = await supabaseClient

        .from("friends")

        .select("id, name, slug")

        .order("id");


    console.log("👥 Friends data:", data);

    console.log("❌ Friends error:", error);


    if (error) {

        console.error(
            "Помилка завантаження друзів:",
            error
        );

        return;
    }


    friendSelect.innerHTML =
        '<option value="">Оберіть друга</option>';


    data.forEach(friend => {

        const option =
            document.createElement("option");


        option.value =
            friend.id;


        option.textContent =
            `${friend.name}`;


        friendSelect.appendChild(
            option
        );

    });


    console.log(
        "✅ Друзів завантажено:",
        data.length
    );
}

loadFriends();
if (friendToken) {

    friendsTitle.innerHTML = `
        <h2>👤 Ваш баланс</h2>
    `;

}
loadTrips();
