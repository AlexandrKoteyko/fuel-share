const SUPABASE_URL = "https://hunapxoxqkkfvaqejwii.supabase.co";

const SUPABASE_KEY = "sb_publishable_AkD-sMSpXyBW3Eb4taVQxg_zbi3es4B";
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

console.log("SUPABASE URL:", SUPABASE_URL);

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
                slug
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
            "Помилка завантаження";

        return;
    }


    renderTrips(data);

    renderFriends(data);

    calculateTotal(data);
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

        const friend =
            trip.friends;


        if (!friend) {
            continue;
        }


        if (!debts[friend.id]) {

            debts[friend.id] = {

                name: friend.name,

                slug: friend.slug,

                amount: 0

            };

        }


        debts[friend.id].amount +=
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

                return `
                    <div class="friend-row">

                        <span class="friend-name">

                            <a href="/${friend.slug}">
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

    const {
        data,
        error
    } = await supabaseClient
        .from("friends")
        .select("id, name, slug")
        .order("id");


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

        option.value = friend.id;

        option.textContent =
            friend.name;

        friendSelect.appendChild(option);

    });
}

loadFriends();

loadTrips();
