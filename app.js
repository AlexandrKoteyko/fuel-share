const SUPABASE_URL = "https://hunapxoxqkkfvaqejwii.supabase.co";

const SUPABASE_KEY = "sb_publishable_AkD-sMSpXyBW3Eb4taVQxg_zbi3es4B";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
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

        .select("*")

        .order(
            "trip_date",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

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

        if (!debts[trip.friend]) {
            debts[trip.friend] = 0;
        }

        debts[trip.friend] +=
            Number(trip.amount);
    }


    const names =
        Object.keys(debts)
            .sort();


    if (names.length === 0) {

        friendsList.innerHTML =
            "<p>Поки немає записів.</p>";

        return;
    }


    friendsList.innerHTML =
        names
            .map(name => {

                return `
                    <div class="friend-row">

                        <span class="friend-name">
                            ${escapeHtml(name)}
                        </span>

                        <span class="friend-debt">
                            ${debts[name].toFixed(2)} €
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


                return `
                    <div class="trip">

                        <div class="trip-info">

                            <div class="trip-friend">
                                ${escapeHtml(
                                    trip.friend
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


        const friend =
            document.getElementById(
                "friend"
            ).value.trim();


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


        if (!friend || !date || amount <= 0) {

            alert(
                "Заповни ім'я, дату та суму."
            );

            return;
        }


        const {
            error
        } = await supabaseClient

            .from("trips")

            .insert({

                friend: friend,

                trip_date: date,

                amount: amount,

                comment: comment

            });


        if (error) {

            console.error(error);

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


loadTrips();
