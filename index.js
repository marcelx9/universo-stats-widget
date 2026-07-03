const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, "data.json");

app.use(express.json({ limit: "10mb" }));

function readData() {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
    res.send("Widget UniversoCraft funcionando.");
});

app.get("/stats", (req, res) => {
    res.json(readData());
});

app.post("/admin/update", (req, res) => {
    if (req.query.key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: "No autorizado" });
    }

    saveData(req.body);
    res.json({ success: true, data: req.body });
});

app.get("/widget", (req, res) => {
    const data = readData();

    res.json({
        data: {
            dynamic: [
                { type: 1, name: "player_name", value: String(data.player_name) },
                { type: 1, name: "rank", value: String(data.rank) },
                { type: 1, name: "level", value: String(data.level) },
                { type: 1, name: "first_login", value: String(data.first_login) },
                { type: 1, name: "last_login", value: String(data.last_login) },
                { type: 1, name: "friends", value: String(data.friends) },
                {
                    type: 3,
                    name: "player_skin",
                    value: {
                        url: String(data.skin_url)
                    }
                },
                { type: 1, name: "clan", value: String(data.clan) },
                {
                    type: 1,
                    name: "premium",
                    value: String(data.premium)
                },
                {
                    type:1,
                    name:"bedwars_wins",
                    value:String(data.bedwars_wins)
                },

                {
                    type:1,
                    name:"bedwars_kills",
                    value:String(data.bedwars_kills)
                },
                { type: 1, name: "skywars", value: `${data.skywars_wins}W / ${data.skywars_kills}K` },
                { type: 1, name: "skypit", value: `Lv ${data.skypit_level} / ${data.skypit_kills}K / ${data.skypit_deaths}D` }
            ],
            primary: {
                rank: String(data.rank)
            }
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});