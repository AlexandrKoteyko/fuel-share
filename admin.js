const SUPABASE_URL = "https://hunapxoxqkkfvaqejwii.supabase.co";

const SUPABASE_KEY = "sb_publishable_AkD-sMSpXyBW3Eb4taVQxg_zbi3es4B";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ===============================
// ELEMENTS
// ===============================

const loginSection =
    document.getElementById(
        "loginSection"
    );

const adminSection =
    document.getElementById(
        "adminSection"
    );

const loginForm =
    document.getElementById(
        "loginForm"
    );

const loginError =
    document.getElementById(
        "loginError"
    );

const tripForm =
    document.getElementById(
        "tripForm"
    );

const friendSelect =
    document.getElementById(
        "friend"
    );

const friendsList =
    document.getElementById(
        "friendsList"
    );

const tripsList =
    document.getElementById(
        "tripsList"
    );

const totalDebt =
    document.getElementById(
        "totalDebt"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const tripDate =
    document.getElementById(
        "tripDate"
    );


// ===============================
// DEFAULT DATE
// ===============================

tripDate.value =
    new Date()
        .toISOString()
        .split("T")[0];


// ===============================
// LOGIN
// ===============================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        loginError.textContent = "";

        const email =
            document.getElementById(
                "email"
            ).value.trim();

        const password =
            document.getElementById(
                "password"
            ).value;

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email: email,
                    password: password
                });

        if (error) {

            console.error(
                "Login error:",
                error
            );

            loginError.textContent =
                "Неправильний email або пароль.";

            return;
        }

        console.log(
            "Успішний вхід:",
            data.user
        );

        await checkAdmin();

    }
);


// ===============================
// CHECK ADMIN
// ===============================

async function checkAdmin() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth
            .getUser();

    if (!user) {

        showLogin();

        return;
    }

    console.log(
        "Поточний користувач:",
        user.id,
        user.email
    );


    const {
        data,
        error
    } =
        await supabaseClient

            .from("admins")

            .select("user_id")

            .eq(
                "user_id",
                user.id
            )

            .maybeSingle();


    if (error) {

        console.error(
            "Помилка перевірки admin:",
            error
        );

        loginError.textContent =
            "Не вдалося перевірити права адміністратора.";

        showLogin();

        return;
    }


    if (!data) {

        console.error(
            "Користувача немає в admins:",
            user.id
        );

        alert(
            "Цей акаунт не має прав адміністратора."
        );

        await supabaseClient.auth
            .signOut();

        showLogin();

        return;
    }


    console.log(
        "✅ Адміністратор підтверджений"
    );


    showAdmin();

    await loadFriends();

    await loadTrips();

}


// ===============================
// SHOW LOGIN
// ===============================

function showLogin() {

    loginSection.classList.remove(
        "hidden"
    );

    adminSection.classList.add(
        "hidden"
    );

}


// ===============================
// SHOW ADMIN
// ===============================

function showAdmin() {

    loginSection.classList.add(
        "hidden"
    );

    adminSection.classList.remove(
        "hidden"
    );

}


// ===============================
// LOAD FRIENDS
// ===============================

async function loadFriends() {

    console.log(
        "🔄 Завантаження друзів..."
    );


    const {
        data,
        error
    } =
        await supabaseClient

            .from("friends")

            .select(
                "id, name, slug, public_token"
            )

            .order("id");


    if (error) {

        console.error(
            "Помилка завантаження друзів:",
            error
        );

        return;
    }


    console.log(
        "👥 Друзі:",
        data
    );


    friendSelect.innerHTML =
        '<option value="">Оберіть друга</option>';


    data.forEach(
        friend => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                friend.id;

            option.textContent =
                friend.name;

            friendSelect.appendChild(
                option
            );

        }
    );

}


// ===============================
// LOAD TRIPS
// ===============================

async function loadTrips() {

    console.log(
        "🔄 Завантаження поїздок..."
    );


    const {
        data,
        error
    } =
        await supabaseClient

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
            "Помилка завантаження поїздок:",
            error
        );

        tripsList.innerHTML =
            "<p>Помилка завантаження.</p>";

        return;
    }


    console.log(
        "🚗 Поїздки:",
        data
    );


    calculateTotal(data);

    renderFriends(data);

    renderTrips(data);

}


// ===============================
// CALCULATE TOTAL
// ===============================

function calculateTotal(
    trips
) {

    const total =
        trips.reduce(
            (
                sum,
                trip
            ) => {

                return (
                    sum +
                    Number(
                        trip.amount
                    )
                );

            },
            0
        );


    totalDebt.textContent =
        `${total.toFixed(2)} €`;

}


// ===============================
// RENDER FRIENDS
// ===============================

function renderFriends(
    trips
) {

    const debts = {};


    for (
        const trip of trips
    ) {

        if (!trip.friends) {
            continue;
        }


        const friend =
            trip.friends;


        const id =
            friend.id;


        if (!debts[id]) {

            debts[id] = {

                id:
                    friend.id,

                name:
                    friend.name,

                slug:
                    friend.slug,

                public_token:
                    friend.public_token,

                amount: 0

            };

        }


        debts[id].amount +=
            Number(
                trip.amount
            );

    }


    const friends =
        Object.values(
            debts
        );


    if (
        friends.length === 0
    ) {

        friendsList.innerHTML =
            "<p>Поки немає записів.</p>";

        return;
    }


    friendsList.innerHTML =
        friends
            .map(
                friend => {

                    const link =
                        `${window.location.origin}/fuel-share/#friend=${encodeURIComponent(
                            friend.public_token
                        )}`;


                    return `

                        <div class="friend-row">

                            <div>

                                <div class="friend-name">

                                    ${escapeHtml(
                                        friend.name
                                    )}

                                </div>


                                <div class="friend-link">

                                    <button
                                        class="copy-link-button"
                                        onclick="copyFriendLink('${friend.public_token}')"
                                    >
                                        🔗 Копіювати посилання
                                    </button>

                                </div>

                            </div>


                            <strong>

                                ${friend.amount.toFixed(
                                    2
                                )} €

                            </strong>

                        </div>

                    `;

                }
            )
            .join("");

}


// ===============================
// RENDER TRIPS
// ===============================

function renderTrips(
    trips
) {

    if (
        trips.length === 0
    ) {

        tripsList.innerHTML =
            "<p>Поки немає поїздок.</p>";

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


                    const name =
                        trip.friends
                            ? trip.friends.name
                            : "Невідомий";


                    return `

                        <div class="trip">

                            <div class="trip-info">

                                <div class="trip-friend">

                                    ${escapeHtml(
                                        name
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


                            <div>

                                <strong>

                                    +${Number(
                                        trip.amount
                                    ).toFixed(
                                        2
                                    )} €

                                </strong>


                                <button
                                    class="delete-button"
                                    onclick="deleteTrip(${trip.id})"
                                >
                                    🗑️
                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


// ===============================
// ADD TRIP
// ===============================

tripForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const friendId =
            Number(
                friendSelect.value
            );


        const date =
            tripDate.value;


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
                amount === 0 ||
                Number.isNaN(amount)
            ) {
                alert(
                    "Заповни друга, дату та вкажи суму, яка не дорівнює 0."
                );
            
                return;
            }


        console.log(
            "➕ Додаємо:",
            {
                friendId,
                date,
                amount,
                comment
            }
        );


        const {
            error
        } =
            await supabaseClient

                .from("trips")

                .insert({

                    friend_id:
                        friendId,

                    trip_date:
                        date,

                    amount:
                        amount,

                    comment:
                        comment

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


        alert(
            "Поїздку додано!"
        );


        tripForm.reset();


        tripDate.value =
            new Date()
                .toISOString()
                .split("T")[0];


        await loadTrips();

    }
);


// ===============================
// DELETE TRIP
// ===============================

async function deleteTrip(
    id
) {

    const confirmed =
        confirm(
            "Видалити цей запис?"
        );


    if (!confirmed) {
        return;
    }


    console.log(
        "🗑️ Видаляємо:",
        id
    );


    const {
        error
    } =
        await supabaseClient

            .from("trips")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Помилка видалення:",
            error
        );

        alert(
            "Не вдалося видалити запис."
        );

        return;
    }


    await loadTrips();

}


// ===============================
// COPY FRIEND LINK
// ===============================

async function copyFriendLink(
    token
) {

    const link =
        `${window.location.origin}/fuel-share/#friend=${encodeURIComponent(
            token
        )}`;


    console.log(
        "🔗 Посилання:",
        link
    );


    try {

        await navigator.clipboard.writeText(
            link
        );


        alert(
            "Посилання скопійовано!"
        );

    } catch (error) {

        console.error(
            "Clipboard error:",
            error
        );


        prompt(
            "Скопіюй посилання:",
            link
        );

    }

}


// ===============================
// LOGOUT
// ===============================

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth
            .signOut();

        showLogin();

    }
);


// ===============================
// ESCAPE HTML
// ===============================

function escapeHtml(
    value
) {

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


// ===============================
// START
// ===============================

checkAdmin();
